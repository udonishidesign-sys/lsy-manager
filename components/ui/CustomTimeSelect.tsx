"use client";
import FieldStatus from "@/components/ui/FieldStatus";

type Props = {
  required?: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function CustomTimeSelect({
  required,
  label,
  value,
  onChange,
}: Props) {
  const isComplete = String(value ?? "").trim().length > 0;
  const [hour, minute] = value ? value.split(":") : ["00", "00"];

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="mb-1 block text-sm font-bold text-mist-500">
            {label}
          </label>
          {required && <FieldStatus status="required" />}
        </div>
      </div>
      <div
        className="flex items-center gap-2 h-12
            w-full
            rounded-lg
            border
            border-teal-500
            bg-teal-50
            px-3
            text-base
            text-mist-500"
      >
        <select
          required={required}
          value={hour}
          onChange={(e) => onChange(`${e.target.value}:${minute}`)}
          className="outline-none appearance-none"
        >
          {hours.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </select>

        <span className="text-lg">:</span>

        <select
          value={minute}
          onChange={(e) => onChange(`${hour}:${e.target.value}`)}
          className="outline-none appearance-none"
        >
          {minutes.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
