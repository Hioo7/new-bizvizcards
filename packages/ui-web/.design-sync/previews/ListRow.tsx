import { ListRow, Avatar, Badge, IconButton, Card } from "@bizvizcards/ui";
import { Mail, ChevronRight, Trash2, Phone } from "lucide-react";

const noop = () => {};

export const LeadRow = () => (
  <div className="w-80">
    <ListRow
      leading={<Avatar name="Chitra Narayan" />}
      title="Chitra Narayan"
      subtitle="chitra@narayan.co"
      showChevron
      onClick={noop}
    />
  </div>
);

export const WithTrailingValue = () => (
  <div className="w-80">
    <ListRow
      leading={<Mail className="h-5 w-5" />}
      title="Email"
      subtitle="chitra@narayan.co"
      trailing={<Badge tone="success" size="sm">Verified</Badge>}
    />
  </div>
);

export const WithAction = () => (
  <div className="w-80">
    <ListRow
      leading={<Phone className="h-5 w-5" />}
      title="+91 98450 12345"
      subtitle="Mobile"
      trailing={
        <IconButton
          label="Remove number"
          size="sm"
          variant="ghost"
          icon={<Trash2 className="h-4 w-4" />}
        />
      }
    />
  </div>
);

export const InAList = () => (
  <div className="w-80">
    <Card flush>
      <div className="divide-y divide-base-300 px-3">
        <ListRow
          leading={<Avatar name="Chitra Narayan" />}
          title="Chitra Narayan"
          subtitle="Narayan & Co."
          showChevron
          onClick={noop}
        />
        <ListRow
          leading={<Avatar name="Sathvik Rao" />}
          title="Sathvik Rao"
          subtitle="Trade show 2026"
          showChevron
          onClick={noop}
        />
        <ListRow
          leading={<Avatar name="Priya M" />}
          title="Priya Menon"
          subtitle="Website enquiry"
          showChevron
          onClick={noop}
        />
      </div>
    </Card>
  </div>
);
