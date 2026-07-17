import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const SHARE_OPTIONS = [
  {
    id: "email",
    label: "Email",
    bg: "bg-neutral",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-neutral-content" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    getHref: (url: string, name: string) =>
      `mailto:?subject=Connect with ${encodeURIComponent(name)} on BizVizCards&body=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    bg: "bg-[#25D366]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.09-1.34A9.945 9.945 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.71 0-3.3-.46-4.67-1.26l-.33-.2-3.02.8.81-2.95-.22-.35A7.944 7.944 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
      </svg>
    ),
    getHref: (url: string, name: string) =>
      `https://wa.me/?text=${encodeURIComponent(`Connect with ${name} on BizVizCards: ${url}`)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    bg: "bg-[#0A66C2]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    getHref: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
] as const;

interface EcardShareContentProps {
  cardName: string;
  endpoint: string;
  url: string;
}

export default function EcardShareContent({ cardName, endpoint, url }: EcardShareContentProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadQr() {
    const canvas = document.querySelector<HTMLCanvasElement>("#ecard-qr-canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${endpoint}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      {/* QR hero */}
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-base-200/60 py-6">
        <div className="rounded-2xl bg-white p-3 shadow-md">
          <QRCodeCanvas id="ecard-qr-canvas" value={url} size={128} marginSize={0} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-base-content">{cardName}</p>
          <p className="text-xs text-base-content/40 mt-0.5">/{endpoint}</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadQr}
          className="flex items-center gap-1.5 rounded-full border border-base-300 bg-base-100 px-4 py-1.5 text-xs font-semibold text-base-content/60 hover:bg-base-200 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Save QR code
        </button>
      </div>

      {/* URL copy row */}
      <div className="flex items-center gap-2 rounded-xl border border-base-200 bg-base-100 px-3 py-2.5">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-base-content/30" aria-hidden="true">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="min-w-0 flex-1 truncate text-xs text-base-content/50 font-mono">
          {url.replace(/^https?:\/\//, "")}
        </p>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
            copied
              ? "bg-success/15 text-success"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Share via grid */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-base-content/40">
          Share via
        </p>
        <div className="grid grid-cols-3 gap-3">
          {SHARE_OPTIONS.map((opt) => (
            <a
              key={opt.id}
              href={opt.getHref(url, cardName)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-2xl border border-base-200 bg-base-100 py-4 hover:bg-base-200 active:scale-95 transition-all"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${opt.bg}`}>
                {opt.icon}
              </span>
              <span className="text-xs font-semibold text-base-content/60">{opt.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
