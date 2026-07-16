import { CalendarDays, FileText, MapPin, Tag } from "lucide-react";
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
  EVENT_NAME_MAX_LENGTH,
} from "@features/business-events/config";

export interface EventDetailsDraft {
  name: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
}

interface EventDetailsStepProps {
  value: EventDetailsDraft;
  onChange: (value: EventDetailsDraft) => void;
}

export default function EventDetailsStep({
  value,
  onChange,
}: EventDetailsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Event name
        </span>
        <div className="relative">
          <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            maxLength={EVENT_NAME_MAX_LENGTH}
            value={value.name}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
          />
        </div>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Location (optional)
        </span>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            maxLength={EVENT_LOCATION_MAX_LENGTH}
            value={value.location}
            onChange={(event) =>
              onChange({ ...value, location: event.target.value })
            }
            className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
          />
        </div>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Description (optional)
        </span>
        <div className="relative">
          <FileText className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-base-content/40" />
          <textarea
            maxLength={EVENT_DESCRIPTION_MAX_LENGTH}
            value={value.description}
            onChange={(event) =>
              onChange({ ...value, description: event.target.value })
            }
            rows={3}
            className="w-full rounded-field border border-base-300 bg-base-200 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
          />
        </div>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-base-content/60">
            Starts at
          </span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
            <input
              type="datetime-local"
              value={value.startAt}
              onChange={(event) =>
                onChange({ ...value, startAt: event.target.value })
              }
              className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-base-content/60">
            Ends at (optional)
          </span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
            <input
              type="datetime-local"
              value={value.endAt}
              onChange={(event) =>
                onChange({ ...value, endAt: event.target.value })
              }
              className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
