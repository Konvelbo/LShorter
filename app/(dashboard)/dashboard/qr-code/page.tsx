import React, { Suspense } from "react";
import { QRGenerator } from "@/components/qr/qr-generator";
import { QRCodePageSkeleton } from "@/components/ui/skeleton";

export default function QRCodePage() {
  return (
    <div>
      <Suspense fallback={<QRCodePageSkeleton />}>
        <QRGenerator />
      </Suspense>
    </div>
  );
}

