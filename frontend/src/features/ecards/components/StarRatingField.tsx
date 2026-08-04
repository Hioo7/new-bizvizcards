import { Star } from "lucide-react";

interface StarRatingFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

export default function StarRatingField({ value, onChange, label }: StarRatingFieldProps) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-base-content/70">{label}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            aria-pressed={star <= value}
            className="flex h-9 w-9 items-center justify-center rounded-field text-base-content/30 hover:text-primary"
          >
            <Star
              className={`h-5 w-5 ${star <= value ? "fill-primary text-primary" : ""}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
