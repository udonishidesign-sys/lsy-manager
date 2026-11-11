type StatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  出勤: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  欠勤: "bg-rose-50 text-rose-700 ring-rose-200",
  稼働中: "bg-blue-50 text-blue-700 ring-blue-200",
  休止中: "bg-slate-100 text-slate-700 ring-slate-200",
  契約終了: "bg-amber-50 text-amber-800 ring-amber-200",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        rounded-sm
        px-1.5 py-0.5
        text-[10px]
        font-semibold
        ring-1 ring-inset
        ${statusStyles[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}
      `}
    >
      {status}
    </span>
  );
}
