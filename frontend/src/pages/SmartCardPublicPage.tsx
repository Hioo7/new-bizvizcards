import { useParams } from "react-router-dom";
import {
  SmartCardRenderer,
  usePublicSmartCard,
  useSmartCardDocumentMeta,
} from "@features/public-smart-card";

export default function SmartCardPublicPage() {
  const { endpoint } = useParams<{ endpoint: string }>();
  const { card, isLoading, error } = usePublicSmartCard(endpoint);
  useSmartCardDocumentMeta(card);

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
        <p className="text-sm text-gray-500">{error ?? "Smart card not found."}</p>
      </div>
    );
  }

  return <SmartCardRenderer card={card} />;
}
