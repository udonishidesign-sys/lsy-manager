import type { Metadata } from "next";
import ClientHeader from "@/components/client/ClientHeader";

export const metadata: Metadata = {
  title: "LSY | 受託先管理",
  description: "LSY 受託先向け日報管理システム",
};

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ClientHeader />

      <div className="min-h-screen bg-white">{children}</div>
    </>
  );
}
