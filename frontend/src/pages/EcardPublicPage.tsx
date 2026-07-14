import { useParams } from "react-router-dom";
import {
  EcardRenderer,
  useEcardDocumentMeta,
  useEcardViewDurationTracker,
  usePublicEcard,
} from "@features/public-ecard";

export default function EcardPublicPage() {
  const { endpoint } = useParams<{ endpoint: string }>();
  const { card, viewEventId, isLoading, error } = usePublicEcard(endpoint);
  useEcardDocumentMeta(card);
  useEcardViewDurationTracker(endpoint, viewEventId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-center">
        <p className="text-sm text-gray-500">{error ?? "E-card not found."}</p>
      </div>
    );
  }

  return <EcardRenderer card={card} />;
}
