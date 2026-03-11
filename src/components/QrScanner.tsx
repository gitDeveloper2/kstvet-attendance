'use client';

import { Scanner } from '@yudiel/react-qr-scanner';
import { useMemo } from 'react';

interface QrScannerProps {
  onDecode: (result: string) => void;
  onError: (error: Error) => void;
}

export default function QrScanner({ onDecode, onError }: QrScannerProps) {
  const constraints = useMemo(() => ({ facingMode: 'environment' as const }), []);

  return (
    <div className="relative rounded-lg overflow-hidden">
      <Scanner
        constraints={constraints}
        onScan={(result) => {
          if (!result) return;
          // Library may return a string or an array of detected codes depending on version.
          const text = Array.isArray(result) ? (result[0] as any)?.rawValue : (result as any)?.rawValue ?? result;
          if (typeof text === 'string' && text.trim()) {
            onDecode(text);
          }
        }}
        onError={(e) => {
          onError(e as any);
        }}
      />

      <div className="pointer-events-none absolute inset-0 border-4 border-white/70 rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-white/80 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
