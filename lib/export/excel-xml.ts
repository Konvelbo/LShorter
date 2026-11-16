function escapeXml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface ExcelColumnSpec {
  header: string;
  width?: number;
  align?: "Left" | "Center" | "Right";
  isNumber?: boolean;
  isMoney?: boolean;
}

export function generateTableExcelXml(
  sheetName: string,
  columns: ExcelColumnSpec[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  const colsXml = columns
    .map(
      (c) =>
        `    <Column ss:AutoFitWidth="1" ss:Width="${c.width || 180}"/>`,
    )
    .join("\n");

  const headerRowXml =
    `    <Row ss:Height="26">\n` +
    columns
      .map(
        (c) =>
          `     <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`,
      )
      .join("\n") +
    `\n    </Row>`;

  let dataRowsXml = "";
  if (rows.length === 0) {
    dataRowsXml = `    <Row ss:Height="22">\n     <Cell ss:StyleID="DataCellLeft" ss:MergeAcross="${Math.max(columns.length - 1, 1)}"><Data ss:Type="String">Aucune donnée disponible</Data></Cell>\n    </Row>`;
  } else {
    dataRowsXml = rows
      .map((row) => {
        const cells = columns
          .map((col, idx) => {
            const val = row[idx];
            if (val === null || val === undefined || val === "") {
              return `     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">—</Data></Cell>`;
            }
            if (col.isMoney) {
              const num =
                typeof val === "number"
                  ? val
                  : parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0;
              return `     <Cell ss:StyleID="MoneyCell"><Data ss:Type="Number">${num.toFixed(2)}</Data></Cell>`;
            }
            if (col.isNumber) {
              const num = typeof val === "number" ? val : Number(val);
              if (!isNaN(num)) {
                return `     <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${num}</Data></Cell>`;
              }
            }
            const alignStyle =
              col.align === "Center"
                ? "DataCellCenter"
                : col.align === "Right"
                  ? "NumberCell"
                  : "DataCellLeft";
            return `     <Cell ss:StyleID="${alignStyle}"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
          })
          .join("\n");
        return `    <Row ss:Height="22">\n${cells}\n    </Row>`;
      })
      .join("\n");
  }

  const safeSheetName = escapeXml(sheetName.substring(0, 31));

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1F2937"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4D4D8"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#FF6600" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataCellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1F2937"/>
  </Style>
  <Style ss:ID="DataCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1F2937"/>
  </Style>
  <Style ss:ID="NumberCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#111827"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="MoneyCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#16A34A"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#16A34A"/>
   <NumberFormat ss:Format="$#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${safeSheetName}">
  <Table ss:DefaultRowHeight="20">
${colsXml}
${headerRowXml}
${dataRowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
}
