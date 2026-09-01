import { Sheet, Button, TextField, TextareaField } from "@bizvizcards/ui";
import type { ReactNode } from "react";
import { ScanLine, Mail, User, LogOut } from "lucide-react";

const noop = () => {};

/**
 * Sheet is `position: fixed` in real use. For a static preview card we pin it
 * inside a phone-sized frame and scope `.modal` to `absolute` so it renders
 * inside the card instead of escaping to the viewport.
 */
function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[560px] w-[340px] overflow-hidden rounded-box border border-base-300 bg-base-200 [&_.modal]:absolute">
      {children}
    </div>
  );
}

export const ReviewScannedLead = () => (
  <PhoneFrame>
    <Sheet
      open
      onClose={noop}
      title="Review scanned lead"
      titleIcon={<ScanLine className="h-5 w-5" />}
      description="Check the details we read from the card"
      footer={
        <>
          <Button variant="ghost" onClick={noop}>
            Discard
          </Button>
          <Button variant="primary" onClick={noop}>
            Save lead
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField label="Full name" icon={<User className="h-4 w-4" />} defaultValue="Chitra Narayan" />
        <TextField label="Work email" icon={<Mail className="h-4 w-4" />} defaultValue="chitra@narayan.co" />
        <TextareaField label="Notes" rows={2} defaultValue="123 MG Road, Bengaluru 560001" />
      </div>
    </Sheet>
  </PhoneFrame>
);

export const Confirm = () => (
  <PhoneFrame>
    <Sheet
      open
      onClose={noop}
      title="Log out?"
      titleIcon={<LogOut className="h-5 w-5" />}
      description="You'll need to sign in again to manage your cards."
      footer={
        <>
          <Button variant="ghost" onClick={noop}>
            Cancel
          </Button>
          <Button variant="error" onClick={noop}>
            Log out
          </Button>
        </>
      }
    >
      <p className="text-sm text-base-content/70">
        Any unsaved changes on this device will be lost.
      </p>
    </Sheet>
  </PhoneFrame>
);
