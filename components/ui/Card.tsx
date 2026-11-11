type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`w-full rounded-lg space-y-4 p-4 bg-white border border-mist-200 shadow-md shadow-mist-300 ${className}`}
    >
      {children}
    </div>
  );
}
