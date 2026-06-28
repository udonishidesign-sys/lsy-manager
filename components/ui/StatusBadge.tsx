export default function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    出勤: "bg-green-100 text-green-700",
    欠勤: "bg-red-100 text-red-700",
    稼働中: "bg-blue-100 text-blue-700",
    休止中: "bg-gray-100 text-gray-700",
    契約終了: "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={`
          px-2 py-1
          rounded-sm
          text-xs
          font-medium
          ${statusColors[status] ?? "bg-slate-100 text-slate-700"}
        `}
    >
      {status}
    </span>
  );
}
