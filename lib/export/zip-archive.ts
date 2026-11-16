import zlib from "node:zlib";

function crc32(buf: Buffer): number {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

export interface ZipEntry {
  name: string;
  data: Buffer;
  uncompressedSize: number;
  compressedSize: number;
  method: number;
  crc: number;
}

/**
 * Lightweight pure TypeScript ZIP archive generator without external dependencies.
 * Produces standard PKWARE .zip files with optional DEFLATE compression compatible with
 * Windows Explorer, macOS Finder, 7-Zip, Linux unzip, and standard spreadsheet readers.
 */
export class ZipArchive {
  private files: ZipEntry[] = [];

  /**
   * Adds a file or subfolder path to the ZIP archive.
   * Forward slashes are automatically ensured.
   */
  addFile(filePath: string, content: string | Buffer): void {
    const rawData = Buffer.isBuffer(content)
      ? content
      : Buffer.from(content, "utf8");
    const normalizedPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");

    let compressed: Buffer | null = null;
    try {
      compressed = zlib.deflateRawSync(rawData);
    } catch {
      compressed = null;
    }

    const useCompressed =
      compressed !== null && compressed.length < rawData.length;
    const finalData = useCompressed && compressed ? compressed : rawData;

    this.files.push({
      name: normalizedPath,
      data: finalData,
      uncompressedSize: rawData.length,
      compressedSize: finalData.length,
      method: useCompressed ? 8 : 0,
      crc: crc32(rawData),
    });
  }

  /**
   * Builds the complete binary ZIP buffer.
   */
  toBuffer(): Buffer {
    const localHeaders: Buffer[] = [];
    const centralHeaders: Buffer[] = [];
    let offset = 0;

    for (const f of this.files) {
      const nameBuf = Buffer.from(f.name, "utf8");

      // Local Header (30 bytes + nameBuf)
      const lh = Buffer.alloc(30 + nameBuf.length);
      lh.writeUInt32LE(0x04034b50, 0); // Local header signature
      lh.writeUInt16LE(20, 4); // Min version needed (2.0)
      lh.writeUInt16LE(0x0800, 6); // General purpose bit flag (0x0800 = UTF-8 filename)
      lh.writeUInt16LE(f.method, 8); // Compression method (0 = store, 8 = deflate)
      lh.writeUInt16LE(0, 10); // Last mod time
      lh.writeUInt16LE(0x56a2, 12); // Last mod date (valid DOS date)
      lh.writeUInt32LE(f.crc, 14); // CRC32
      lh.writeUInt32LE(f.compressedSize, 18);
      lh.writeUInt32LE(f.uncompressedSize, 22);
      lh.writeUInt16LE(nameBuf.length, 26);
      lh.writeUInt16LE(0, 28); // Extra field length
      nameBuf.copy(lh, 30);

      const fileOffset = offset;
      localHeaders.push(lh, f.data);
      offset += lh.length + f.data.length;

      // Central Directory Header (46 bytes + nameBuf)
      const ch = Buffer.alloc(46 + nameBuf.length);
      ch.writeUInt32LE(0x02014b50, 0); // Central directory header signature
      ch.writeUInt16LE(20, 4); // Version made by (2.0)
      ch.writeUInt16LE(20, 6); // Version needed (2.0)
      ch.writeUInt16LE(0x0800, 8); // UTF-8 filename flag
      ch.writeUInt16LE(f.method, 10); // Compression method
      ch.writeUInt16LE(0, 12); // Last mod time
      ch.writeUInt16LE(0x56a2, 14); // Last mod date
      ch.writeUInt32LE(f.crc, 16); // CRC32
      ch.writeUInt32LE(f.compressedSize, 20);
      ch.writeUInt32LE(f.uncompressedSize, 24);
      ch.writeUInt16LE(nameBuf.length, 28);
      ch.writeUInt16LE(0, 30); // Extra field length
      ch.writeUInt16LE(0, 32); // File comment length
      ch.writeUInt16LE(0, 34); // Disk number start
      ch.writeUInt16LE(0, 36); // Internal file attributes
      ch.writeUInt32LE(0, 38); // External file attributes
      ch.writeUInt32LE(fileOffset, 42); // Local header offset
      nameBuf.copy(ch, 46);

      centralHeaders.push(ch);
    }

    const cdOffset = offset;
    let cdSize = 0;
    for (const ch of centralHeaders) {
      cdSize += ch.length;
    }

    // End of Central Directory Record (22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
    eocd.writeUInt16LE(0, 4); // Disk number
    eocd.writeUInt16LE(0, 6); // Disk where CD starts
    eocd.writeUInt16LE(this.files.length, 8); // Number of CD entries on this disk
    eocd.writeUInt16LE(this.files.length, 10); // Total number of CD entries
    eocd.writeUInt32LE(cdSize, 12); // Size of Central Directory
    eocd.writeUInt32LE(cdOffset, 16); // Offset of Central Directory
    eocd.writeUInt16LE(0, 20); // ZIP comment length

    return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
  }
}
