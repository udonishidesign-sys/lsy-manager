type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`w-full rounded-lg space-y-4 p-4 bg-white ${className}`}>
      {children}
    </div>
  );
}
