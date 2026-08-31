interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

/** Full-bleed live camera feed. */
export default function CameraView({ videoRef }: CameraViewProps) {
  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      autoPlay
      muted
      playsInline
    />
  );
}
