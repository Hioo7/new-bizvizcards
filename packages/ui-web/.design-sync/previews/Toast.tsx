import { Toast } from "@bizvizcards/ui";
import { CircleCheck, CircleAlert, TriangleAlert, Info } from "lucide-react";

const noop = () => {};

export const Error = () => (
  <div className="w-96">
    <Toast tone="error" icon={<CircleAlert className="h-5 w-5" />}>
      Couldn't read that card — try a clearer photo
    </Toast>
  </div>
);

export const Success = () => (
  <div className="w-96">
    <Toast tone="success" icon={<CircleCheck className="h-5 w-5" />} onDismiss={noop}>
      Lead saved to “Trade show 2026”
    </Toast>
  </div>
);

export const AllTones = () => (
  <div className="flex w-96 flex-col gap-2">
    <Toast tone="info" icon={<Info className="h-5 w-5" />}>
      Your card link was copied
    </Toast>
    <Toast tone="warning" icon={<TriangleAlert className="h-5 w-5" />}>
      Scanner is busy — try again in a moment
    </Toast>
    <Toast tone="error" icon={<CircleAlert className="h-5 w-5" />}>
      Too many scans — wait a few seconds
    </Toast>
  </div>
);
