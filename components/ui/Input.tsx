import FieldStatus from "@/components/ui/FieldStatus";

type Props = {
  required?: boolean;
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export default function Input({
  required,
  label,
  type = "text",
  value,
  onChange,
  suffix,
  disabled,
  placeholder,
  className,
}: Props) {
  const isComplete = String(value ?? "").trim().length > 0;

  return (
    <div className="block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-mist-500 font-bold">{label}</span>
          {required && <FieldStatus status="required" />}
        </div>
      </div>

      <div className="relative h-12">
        <input
          required={required}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          className={`
            block w-full h-12
            rounded-lg border border-teal-500
            bg-teal-50 leading-12
            px-3 ${suffix ? "pr-10" : ""}
            text-base text-mist-500
            outline-none appearance-none
            disabled:bg-slate-100 disabled:text-slate-400
            ${className ?? ""}
          `}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 leading-none text-sm text-mist-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
