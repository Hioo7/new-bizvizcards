import type { LeadFormAnswer } from "@features/user-dashboard/types";
import FieldCard from "./FieldCard";

interface LeadFormAnswersProps {
  answers: LeadFormAnswer[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const QUESTION_ICON = (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M9.5 9a2.5 2.5 0 114.19 1.85c-.7.62-1.19 1.05-1.19 2.15"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line x1="12" y1="17" x2="12" y2="17.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function LeadFormAnswers({ answers }: LeadFormAnswersProps) {
  if (answers.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-base-content/40">
        Form answers
      </p>
      {answers.map((answer) => (
        <FieldCard
          key={answer.fieldId}
          icon={QUESTION_ICON}
          label={answer.label}
          value={answer.type === "DATE" ? formatDate(answer.value) : answer.value}
        />
      ))}
    </div>
  );
}
