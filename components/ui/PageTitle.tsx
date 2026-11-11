type PageTitleProps = {
  children: React.ReactNode;
};

export default function PageTitle({ children }: PageTitleProps) {
  return (
    <h2 className="text-xl font-bold text-mist-700 flex items-center justify-between">
      {children}
    </h2>
  );
}
