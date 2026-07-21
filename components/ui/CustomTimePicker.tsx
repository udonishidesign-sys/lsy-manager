"use client";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function CustomTimeSelect({ label, value, onChange }: Props) {
  const [hour, minute] = value ? value.split(":") : ["--", "--"];

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm text-slate-700">{label}</label>

      <div
        className="flex items-center gap-2 h-12
            w-full
            rounded-lg
            border
            border-teal-500
            bg-teal-50
            px-3
            text-base
            text-slate-700"
      >
        <select
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
