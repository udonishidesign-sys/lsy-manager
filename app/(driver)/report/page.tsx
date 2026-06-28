"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardPen, History, Upload, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ReportHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
        return;
      }

      setLoading(false);
    };

    check();
  }, [router]);

  if (loading) {
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
