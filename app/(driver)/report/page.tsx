"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardPen, History, Upload, ChevronRight } from "lucide-react";
import { getDriverSessionId } from "@/lib/driver-session";

export default function ReportHomePage() {
  const router = useRouter();
  const [driverId, setDriverId] = useState<number | null>(null);

  useEffect(() => {
    const id = getDriverSessionId();

    if (!id) {
      router.push("/login");
      return;
    }

    setDriverId(id);
  }, [router]);

  if (!driverId) {
    return (
      <main className="p-4 max-w-md mx-auto">
        <p className="text-xs text-gray-400">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="p-4 min-h-screen max-w-md mx-auto bg-white">
      <div className="max-w-md space-y-4">
        <Link
          href="/report/new"
          className="flex items-center justify-between bg-teal-500 text-white rounded-lg p-5 text-center font-bold shadow"
        >
          <ClipboardPen size={28} className="text-white" />
          日報入力
          <ChevronRight size={28} className="text-white" />
        </Link>

        <Link
          href="/report/upload"
          className="flex items-center justify-between bg-cyan-500 text-white rounded-lg p-5 text-center font-bold shadow"
        >
          <Upload size={28} className="text-white" />
          ファイル提出
          <ChevronRight size={28} className="text-white" />
        </Link>

        <Link
          href="/report/history"
          className="flex items-center justify-between bg-sky-500 text-white rounded-lg p-5 text-center font-bold shadow"
        >
          <History size={28} className="text-white" />
          日報履歴
          <ChevronRight size={28} className="text-white" />
        </Link>
      </div>
    </main>
  );
}
