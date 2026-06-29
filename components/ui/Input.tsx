type Props = {
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: string;
  disabled?: boolean;
  placeholder?: string;
};

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  suffix,
  disabled,
  placeholder,
}: Props) {
  const isTime = type === "time";
  const showClear = isTime && !disabled && value !== "" && value !== undefined;

  const handleClear = () => {
    // iOSのネイティブ「クリア」ボタンはinputイベントを発火させないことがあり、
    // Reactのonchangeが検知できず画面が更新されないケースがある。
    // そのため、独自のクリアボタンで直接onChangeを呼び出す。
    onChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <label className="block">
      <span className="block text-sm text-gray-500 mb-1">{label}</span>

      <div className="relative h-12">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          className={`
            block w-full h-12
            rounded-lg border border-teal-500
            bg-teal-50 leading-12
            px-3 ${suffix || showClear ? "pr-10" : ""}
            text-base text-slate-700
            outline-none appearance-none
            disabled:bg-slate-100 disabled:text-slate-400
          `}
        />

        {suffix && !showClear && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 leading-none text-sm text-slate-500">
            {suffix}
          </span>
        )}

        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="クリア"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            ×
          </button>
        )}
      </div>
    </label>
  );
}
