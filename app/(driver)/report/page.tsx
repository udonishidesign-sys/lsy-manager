"use client";

import Link from "next/link";
import { ClipboardPen, History, Upload, ChevronRight } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

export default function ReportHomePage() {
  return (
    <AuthGuard>
      <main className="p-4 min-h-screen max-w-md mx-auto bg-white">
        <div className="max-w-md space-y-4">
          <Link
            href="/report/new"
            className="flex items-center justify-between bg-teal-500 text-white rounded-lg p-5 text-center font-bold shadow"
          >
            <ClipboardPen size={28} />
            日報入力
            <ChevronRight size={28} />
          </Link>

          <Link
            href="/report/upload"
            className="flex items-center justify-between bg-cyan-500 text-white rounded-lg p-5 text-center font-bold shadow"
          >
            <Upload size={28} />
            ファイル提出
            <ChevronRight size={28} />
          </Link>

          <Link
            href="/report/history"
            className="flex items-center justify-between bg-sky-500 text-white rounded-lg p-5 text-center font-bold shadow"
          >
            <History size={28} />
            日報履歴
            <ChevronRight size={28} />
          </Link>
        </div>
      </main>
    </AuthGuard>
  );
}
