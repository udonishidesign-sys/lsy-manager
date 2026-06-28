import Link from "next/link";
import React from "react";

type Action = {
  type: "back" | "edit" | "detail" | "create";
  href: string;
  target?: "_blank" | "_self";
  label?: string;
  icon?: React.ReactNode;
  className?: string;
};

type Props = {
  actions: Action[];
};

const styleMap = {
  back: "px-4 h-12 bg-mist-400 rounded-lg font-bold flex gap-1.5 items-center justify-center",
  edit: "px-4 h-12 bg-teal-500 text-white rounded-lg font-bold flex gap-1.5 items-center justify-center",
  detail:
    "px-4 h-12 bg-white text-teal-500 border border-teal-500 rounded-lg font-bold flex items-center justify-center",
  create:
    "px-4 h-12 bg-teal-400 text-white rounded-lg font-bold flex gap-1.5 items-center",
};

const defaultLabel = {
  back: "戻る",
  edit: "編集",
  detail: "詳細",
  create: "追加",
};

export default function PageActions({ actions }: Props) {
  return (
    <div>
      {actions.map((a) => (
        <Link
          key={`${a.type}-${a.href}`}
          href={a.href}
          target={a.target}
          rel={a.target === "_blank" ? "noopener noreferrer" : undefined}
          className={`${styleMap[a.type]} ${a.className ?? ""}`}
        >
          {a.icon && <span className="block align-text-bottom ">{a.icon}</span>}
          <span className={a.icon ? "hidden sm:inline" : "inline"}>
            {a.label ?? defaultLabel[a.type]}
          </span>
        </Link>
      ))}
    </div>
  );
}
