"use client";

import { Check } from "lucide-react";

type CheckboxProps = {
    checked: boolean;
    label: string;
    onChange: (checked: boolean) => void;
  };
  
  export default function Checkbox({
    checked,
    label,
    onChange,
  }: CheckboxProps) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-full flex items-center p-3 rounded-lg bg-slate-50 gap-3"
      >
        <div
  className={`
    w-5 h-5 rounded border border-teal-500 flex items-center justify-center transition
    ${
      checked
        ? "bg-teal-500 border-teal-500"
        : "bg-white border-slate-300"
    }
  `}
>
  {checked && (
    <Check size={16} className="text-white" />
  )}
</div>
        <span className="text-slate-700">
          {label}
        </span>
      </button>
    );
  }