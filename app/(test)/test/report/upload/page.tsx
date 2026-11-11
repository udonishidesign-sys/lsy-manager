"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UploadPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/test/report");
  }, [router]);
  return (
    <main className="p-6 text-sm text-slate-500">ホームに移動しています…</main>
  );
}
