type PageTitleProps = {
  children: React.ReactNode;
};

export default function PageTitle({ children }: PageTitleProps) {
  return <h2 className="text-xl font-bold text-teal-600">{children}</h2>;
}
