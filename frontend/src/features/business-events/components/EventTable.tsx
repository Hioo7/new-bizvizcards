import { CalendarDays } from "lucide-react";
import type { EventSummary } from "@app-types/businessEvent";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import EventRow from "@features/business-events/components/EventRow";

interface EventTableProps {
  events: EventSummary[];
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  canDelete: boolean;
  onManage: (event: EventSummary) => void;
  onEdit: (event: EventSummary) => void;
  onDelete: (event: EventSummary) => void;
}

export default function EventTable({
  events,
  isLoading,
  error,
  hasActiveFilters,
  canDelete,
  onManage,
  onEdit,
  onDelete,
}: EventTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return <FormErrorRibbon message={error} />;
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <CalendarDays className="h-8 w-8 text-base-content/30" />
        <p className="text-sm text-base-content/60">
          {hasActiveFilters
            ? "No events match your search."
            : "No events yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <tbody>
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              canDelete={canDelete}
              onManage={() => onManage(event)}
              onEdit={() => onEdit(event)}
              onDelete={() => onDelete(event)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
