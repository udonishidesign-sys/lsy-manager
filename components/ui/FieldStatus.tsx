import {
  CheckCircle2,
  CircleAlert,
  Asterisk,
  Save,
  Clock,
  Send,
} from "lucide-react";

type FieldStatusType =
  | "complete"
  | "empty"
  | "required"
  | "saved"
  | "inProgress"
  | "submitted";

type FieldStatusProps = {
  status: FieldStatusType;
  label?: string;
};

const styles = {
  complete: {
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
    label: "入力済み",
  },
  empty: {
    className: "bg-amber-50 text-amber-800 ring-amber-200",
    icon: CircleAlert,
    label: "未入力",
  },
  required: {
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    icon: Asterisk,
    label: "必須",
  },
  saved: {
    className: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: Save,
    label: "保存済み",
  },
  inProgress: {
    className: "bg-amber-50 text-amber-800 ring-amber-200",
    icon: Clock,
    label: "入力途中",
  },
  submitted: {
    className: "bg-teal-50 text-teal-700 ring-teal-200",
    icon: Send,
    label: "提出済み",
  },
};

export default function FieldStatus({ status, label }: FieldStatusProps) {
  const config = styles[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${config.className}`}
    >
      <Icon size={10} aria-hidden="true" />
      {label ?? config.label}
    </span>
  );
}
