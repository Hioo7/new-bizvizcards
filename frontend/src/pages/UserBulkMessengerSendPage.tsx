import { useNavigate, useParams } from "react-router-dom";
import { SendDetailView } from "@features/bulk-messenger";
import { ROUTES } from "@config/routes";

export default function UserBulkMessengerSendPage() {
  const navigate = useNavigate();
  const { sendId } = useParams<{ sendId: string }>();

  return (
    <SendDetailView
      sendId={sendId}
      onBack={() => navigate(ROUTES.userBulkMessenger)}
    />
  );
}
