"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getDriverSessionId } from "@/lib/driver-session";
import { formatYen } from "@/lib/drivers";
import StatusBadge from "@/components/ui/StatusBadge";
import PageTitle from "@/components/ui/PageTitle";
import AuthGuard from "@/components/AuthGuard";

type Report = {
  id: number;
  driver_id: number;
  project_id: number;
  report_date: string;
  delivery_count: number;
  delivery_area: string | null;
  unit_price: number;
  work_status: "出勤" | "欠勤";
  note: string | null;
};

export default function ReportHistoryPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const sessionId = getDriverSessionId();

    if (!sessionId) return;

    const fetchData = async () => {
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id,name");

      const { data: reportsData } = await supabase
        .from("daily_reports")
        .select("*")
        .is("deleted_at", null)
        .eq("driver_id", sessionId)
        .order("report_date", { ascending: false });

      setProjects(projectsData ?? []);
      setReports(reportsData ?? []);
    };

    fetchData();
  }, []);

  return (
    <AuthGuard>
      <main className="px-4 pt-24 pb-40">
        <div className="max-w-md mx-auto space-y-4">
          <PageTitle>日報履歴</PageTitle>

          {reports.length === 0 ? (
            <p className="text-gray-500 text-sm">まだ日報がありません</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => {
                const sales = (r.delivery_count ?? 0) * (r.unit_price ?? 0);

                const projectName =
                  projects.find((p) => p.id === Number(r.project_id))?.name ??
                  "不明";

                return (
                  <Link
                    href={`/report/history/${r.id}`}
                    key={r.id}
                    className="block bg-white rounded-lg p-4 shadow border border-teal-500 hover:border-teal-400"
                  >
                    <div className="flex gap-2 items-center">
                      <p className="font-medium text-gray-500">
                        {r.report_date}
                      </p>
                      <StatusBadge status={r.work_status} />
                    </div>

                    <p className="text-sm text-gray-500">
                      配送 {r.delivery_count}個 / 売上 {formatYen(sales)}
                    </p>
                    {r.delivery_area && (
                      <p className="text-xs text-gray-400">
                        配送エリア: {r.delivery_area}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
