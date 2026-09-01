import { StatCard } from "@bizvizcards/ui";
import { Eye, Users, QrCode, Download } from "lucide-react";

export const SingleUp = () => (
  <div className="w-44">
    <StatCard
      label="Card views"
      value={1284}
      icon={<Eye className="h-5 w-5" />}
      trend="up"
      trendLabel="+12%"
    />
  </div>
);

export const Trends = () => (
  <div className="grid w-[26rem] grid-cols-2 gap-3">
    <StatCard label="Card views" value={1284} icon={<Eye className="h-5 w-5" />} trend="up" trendLabel="+12%" />
    <StatCard label="Contacts exchanged" value={92} icon={<Users className="h-5 w-5" />} trend="down" trendLabel="-4%" />
    <StatCard label="QR scans" value={318} icon={<QrCode className="h-5 w-5" />} trend="neutral" />
    <StatCard label="vCard saves" value={47} icon={<Download className="h-5 w-5" />} trend="up" trendLabel="+9%" />
  </div>
);

export const StringValue = () => (
  <div className="w-44">
    <StatCard label="Avg. time on card" value="1m 12s" icon={<Eye className="h-5 w-5" />} />
  </div>
);
