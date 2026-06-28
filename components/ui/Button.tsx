import { Save, RefreshCw, Plus, Trash2 } from "lucide-react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "save"
  | "update"
  | "create"
  | "delete";

type Props = {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  iconOnly?: boolean;
  ariaLabel?: string;
  type?: "button" | "submit" | "reset";
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "h-12 bg-teal-600 text-white hover:bg-teal-700",
  secondary: "h-12 bg-slate-200 text-slate-700 hover:bg-slate-300",
  save: "h-12 bg-orange-400 text-white hover:bg-orange-7600",
  update: "h-12 bg-amber-500 text-white hover:bg-orangeb-700",
  create: "h-12 bg-teal-600 text-white hover:bg-teal-600",
  delete:
    "h-12 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white",
};

const defaultIcon: Partial<Record<ButtonVariant, React.ReactNode>> = {
  save: <Save size={18} />,
  update: <RefreshCw size={18} />,
  create: <Plus size={18} />,
  delete: <Trash2 size={18} />,
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  icon,
  showIcon = true,
  iconOnly = false,
  ariaLabel,
  type = "button",
}: Props) {
  const buttonIcon = icon ?? defaultIcon[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={iconOnly ? ariaLabel : undefined}
      title={iconOnly ? ariaLabel : undefined}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg transition cursor-pointer
        font-bold

        ${iconOnly ? "w-11 h-11 p-0" : "w-fit px-4 py-3"}

        ${variantClass[variant]}

        disabled:opacity-50 disabled:cursor-not-allowed

        ${className}
      `}
    >
      {showIcon && buttonIcon}
      {!iconOnly && children}
    </button>
  );
}
