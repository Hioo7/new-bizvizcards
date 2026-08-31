import { CARD_ASPECT_RATIO } from "@features/card-scan/config";

interface ViewfinderFrameProps {
  /** Pulse the corner ticks while a scan is running. */
  active: boolean;
}

/** A business-card-shaped guide overlaid on the camera feed — tells the user
 *  how to frame the shot. Non-interactive. */
export default function ViewfinderFrame({ active }: ViewfinderFrameProps) {
  const corner =
    "absolute h-8 w-8 border-primary transition-opacity" +
    (active ? " animate-pulse" : "");

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
      <div
        className="relative w-full max-w-md rounded-xl border border-white/40"
        style={{ aspectRatio: CARD_ASPECT_RATIO }}
      >
        <span className={`${corner} -left-px -top-px rounded-tl-xl border-l-[3px] border-t-[3px]`} />
        <span className={`${corner} -right-px -top-px rounded-tr-xl border-r-[3px] border-t-[3px]`} />
        <span className={`${corner} -bottom-px -left-px rounded-bl-xl border-b-[3px] border-l-[3px]`} />
        <span className={`${corner} -bottom-px -right-px rounded-br-xl border-b-[3px] border-r-[3px]`} />
      </div>
    </div>
  );
}
