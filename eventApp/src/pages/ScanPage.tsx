import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import QRScanner from '../components/QRScanner';
import type { GateScanResult, ScanPayload, TrackableScanResult } from '../types';

type ScanMode = 'gate' | 'trackable';

interface Props {
  mode: ScanMode;
}

type ScanResult = GateScanResult | TrackableScanResult;

function isGateResult(r: ScanResult): r is GateScanResult {
  return 'checkedInAt' in r;
}

export default function ScanPage({ mode }: Props) {
  const navigate = useNavigate();
  const { eventId, trackableId } = useParams<{ eventId: string; trackableId: string }>();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleScan(payload: ScanPayload) {
    if (scanning || !eventId) return;
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      let res: ScanResult;
      if (mode === 'gate') {
        res = await api.scanGate(eventId, payload);
      } else {
        if (!trackableId) throw new Error('Missing trackable ID');
        res = await api.scanTrackable(eventId, trackableId, payload);
      }
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  const title = mode === 'gate' ? 'Gate Check-In' : 'Scan Trackable';

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Header */}
      <header className="bg-primary px-4 pt-10 pb-5 flex items-center gap-3">
        <button
          className="btn btn-ghost btn-sm text-primary-content p-1"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-primary-content">{title}</h1>
          <p className="text-sm text-primary-content/70">
            {mode === 'gate' ? 'Scan guest card to check in' : 'Scan guest card to redeem'}
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col gap-4">
        {/* Result card */}
        {result && (
          <div className="alert alert-success flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 font-bold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 shrink-0" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isGateResult(result) ? 'Checked In!' : 'Redeemed!'}
            </div>
            <p className="text-sm font-semibold">{result.customerName}</p>
            <p className="text-xs opacity-70">
              {isGateResult(result)
                ? `at ${new Date(result.checkedInAt).toLocaleTimeString()}`
                : `at ${new Date(result.redeemedAt).toLocaleTimeString()}`}
            </p>
            <button className="btn btn-sm btn-outline mt-1" onClick={reset}>
              Scan next
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Scan failed
            </div>
            <p className="text-sm">{error}</p>
            <button className="btn btn-sm btn-outline mt-1" onClick={reset}>
              Try again
            </button>
          </div>
        )}

        {/* Scanner — hide while showing result */}
        {!result && (
          <>
            {scanning && (
              <div className="flex items-center justify-center gap-2 text-sm text-base-content/60">
                <span className="loading loading-spinner loading-sm" />
                Processing scan…
              </div>
            )}
            <QRScanner onScan={handleScan} onError={(msg) => setError(msg)} />
          </>
        )}
      </main>
    </div>
  );
}
