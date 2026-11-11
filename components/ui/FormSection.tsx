import { ReactNode } from "react";
import FieldStatus from "@/components/ui/FieldStatus";

type FormSectionProps = {
  icon: ReactNode;
  title: string;
  required?: boolean;
};

export default function FormSection({
  icon,
  title,
  required = true,
}: FormSectionProps) {
  return (
    <div className="mb-4 flex items-center gap-2 pb-2 text-teal-500 border-b">
      {icon}
      <h2 className="w-full font-bold text-mist-700 flex items-center justify-between">
        {title}
        {required && <FieldStatus status="required" />}
      </h2>
    </div>
  );
}
