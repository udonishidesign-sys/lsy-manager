import { ReactNode } from "react";

export default function FormSection({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 pb-2 text-teal-500 border-b">
      {icon}
      <h2 className="font-bold text-slate-700">
        {title}
      </h2>
    </div>
  );
}