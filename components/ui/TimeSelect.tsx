"use client";

type Props = {
  label: string;
  hour: string;
  minute: string;
  onHourChange: (value: string) => void;
  onMinuteChange: (value: string) => void;
};

export default function TimeSelect({
  label,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: Props) {
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-500">{label}</label>

      <div className="flex items-center gap-2">
        {/* 時 */}
        <div className="flex items-center gap-1">
          <select
            className="
            block w-24 h-12 px-3
            rounded-lg border border-teal-500
            bg-teal-50 leading-12
            text-base text-slate-700
            outline-none appearance-none
            disabled:bg-slate-100 disabled:text-slate-400"
            value={hour}
            onChange={(e) => onHourChange(e.target.value)}
          >
            {Array.from({ length: 24 }, (_, i) => {
              const h = String(i).padStart(2, "0");

              return (
                <option key={h} value={h}>
                  {h}
                </option>
              );
            })}
          </select>

          <span className="text-gray-500">時</span>
        </div>

        {/* 分 */}
        <div className="flex items-center gap-1">
          <select
            className="
             block w-24 h-12 px-3
             rounded-lg border border-teal-500
             bg-teal-50 leading-12
             text-base text-slate-700
             outline-none appearance-none
             disabled:bg-slate-100 disabled:text-slate-400"
            value={minute}
            onChange={(e) => onMinuteChange(e.target.value)}
          >
            {Array.from({ length: 60 }, (_, i) => {
              const m = String(i).padStart(2, "0");

              return (
                <option key={m} value={m}>
                  {m}
                </option>
              );
            })}
          </select>

          <span className="text-gray-500">分</span>
        </div>
      </div>
    </div>
  );
}
