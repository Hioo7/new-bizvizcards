import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { parseQRCode } from '../parseQR';
import type { ScanPayload } from '../types';

interface Props {
  onScan: (payload: ScanPayload) => void;
  onError?: (msg: string) => void;
}

export default function QRScanner({ onScan, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const containerId = 'qr-scanner-container';
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const payload = parseQRCode(decodedText);
          if (payload) {
            onScan(payload);
          } else {
            onError?.(`Unrecognised QR code: ${decodedText}`);
          }
        },
        () => {
          // frame scan failure — ignore
        },
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Camera unavailable';
        setCameraError(msg);
      });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(() => undefined);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = parseQRCode(manualInput.trim());
    if (!payload) {
      setParseError('Could not parse this URL. Paste the full card URL.');
      return;
    }
    setParseError(null);
    onScan(payload);
    setManualInput('');
  }

  return (
    <div className="flex flex-col gap-4">
      {cameraError ? (
        <div className="alert alert-warning text-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Camera unavailable — use manual entry below.
        </div>
      ) : (
        <div
          id="qr-scanner-container"
          ref={containerRef}
          className="w-full rounded-2xl overflow-hidden bg-base-300"
        />
      )}

      {/* Manual entry fallback */}
      <div className="divider text-xs text-base-content/40">or enter manually</div>
      <form onSubmit={handleManualSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Paste card URL (e.g. https://…/ecard/abc123)"
          value={manualInput}
          onChange={(e) => {
            setManualInput(e.target.value);
            setParseError(null);
          }}
        />
        {parseError && (
          <p className="text-xs text-error">{parseError}</p>
        )}
        <button type="submit" className="btn btn-primary w-full">
          Submit
        </button>
      </form>
    </div>
  );
}
