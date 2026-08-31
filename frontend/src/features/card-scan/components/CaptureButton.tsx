interface CaptureButtonProps {
  onCapture: () => void;
  disabled: boolean;
}

/** The big circular shutter. Icon-only. */
export default function CaptureButton({ onCapture, disabled }: CaptureButtonProps) {
  return (
    <button
      type="button"
      onClick={onCapture}
      disabled={disabled}
      aria-label="Scan card"
      className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 border-white transition-transform active:scale-90 disabled:opacity-40"
    >
      <span className="h-14 w-14 rounded-full bg-white" />
    </button>
  );
}
