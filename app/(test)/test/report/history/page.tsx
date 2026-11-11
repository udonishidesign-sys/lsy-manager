"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getDriverSessionId } from "@/lib/driver-session";
import StatusBadge from "@/components/ui/StatusBadge";
import PageTitle from "@/components/ui/PageTitle";
import AuthGuard from "@/components/AuthGuard";
import Card from "@/components/ui/Card";
import {
  FileText,
  ChevronRight,
  CalendarDays,
  History,
  Filter,
} from "lucide-react";

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
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"すべて" | "出勤" | "欠勤">(
    "すべて",
  );

  useEffect(() => {
    const sessionId = getDriverSessionId();
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const [
        { data: projectsData },
        { data: reportsData },
        { data: checksData },
      ] = await Promise.all([
        supabase.from("projects").select("id,name"),
        supabase
          .from("daily_reports")
          .select("*")
          .is("deleted_at", null)
          .eq("driver_id", sessionId)
          .order("report_date", { ascending: false }),
        supabase
          .from("driver_vehicle_checks")
          .select("check_date")
          .eq("driver_id", sessionId),
      ]);
      setProjects(projectsData ?? []);
      setReports(reportsData ?? []);
      setCheckedDates(
        new Set(
          (checksData ?? []).map(
            (item: { check_date: string }) => item.check_date,
          ),
        ),
      );
      setLoading(false);
    };

    void fetchData();
  }, []);

  const filteredReports = reports.filter((report) => {
    const reportDate = report.report_date;

    if (startDate && reportDate < startDate) return false;
    if (endDate && reportDate > endDate) return false;

    return true;
  });

  return (
    <AuthGuard>
      <main className="min-h-screen px-4 pb-28 pt-24">
        <div className="mx-auto max-w-md space-y-4">
          <header className="rounded-lg border border-mist-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 rounded-t-lg bg-mist-100 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
                <History size={24} />
              </div>
              <div className="min-w-0">
                <PageTitle>業務履歴</PageTitle>
                <p className="mt-0.5 text-xs leading-5 text-mist-500">
                  保存済みの日報を日付ごとに確認できます。
                </p>
              </div>
            </div>

            <div className="w-full min-w-0 max-w-full p-4">
              {!loading && reports.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 ">
                  <label className="flex items-center gap-2 rounded-md bg-white border border-slate-200 px-3 py-2 text-base text-slate-600">
                    <CalendarDays size={16} />
                    <input
                      type="date"
                      value={startDate}
                      max={endDate || undefined}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="min-w-0 bg-transparent test-base text-slate-800 outline-none"
                    />
                  </label>
                  <span className="text-sm text-slate-500">〜</span>
                  <label className="flex items-center gap-2 rounded-md bg-white border border-slate-200 px-3 py-2 text-base text-slate-600">
                    <CalendarDays size={16} />
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="min-w-0 bg-transparent test-base text-slate-800 outline-none"
                    />
                  </label>

                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="text-sm text-slate-500 underline"
                    >
                      クリア
                    </button>
                  )}
                </div>
              )}
            </div>
          </header>

          {loading ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">
              履歴を読み込み中…
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <CalendarDays className="mx-auto text-slate-300" size={32} />
              <p className="mt-3 font-semibold text-slate-700">
                まだ日報がありません
              </p>
              <p className="mt-1 text-sm text-slate-500">
                日報を保存すると、ここに履歴が表示されます。
              </p>
              <Link
                href="/test/report/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                日報を入力する <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((r) => {
                const projectName =
                  projects.find((p) => p.id === Number(r.project_id))?.name ??
                  "案件未設定";
                const isShein = projectName === "SHEIN";
                const inspectionDone = checkedDates.has(r.report_date);
                return (
                  <Card key={r.id}>
                    <Link
                      href={`/test/report/history/${r.id}`}
                      className="block transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            {r.report_date}
                          </p>
                          <h2 className="mt-1 font-bold text-slate-900">
                            {projectName}
                          </h2>
                        </div>
                        <StatusBadge status={r.work_status} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {!isShein && (
                          <span
                            className={`rounded-full px-2.5 py-1 ${inspectionDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                          >
                            点検：{inspectionDone ? "保存済み" : "未入力"}
                          </span>
                        )}
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-slate-600">
                          日報：保存済み
                        </span>
                        <span className="text-mist-600">
                          配送 {r.delivery_count ?? 0}個
                        </span>
                      </div>
                    </Link>
                    <div className="flex gap-4 w-full">
                      <Link
                        href={`/test/report/history/${r.id}`}
                        className="inline-flex basis-1/2 justify-center items-center gap-2 rounded-lg bg-teal-500 px-3 py-2.5 text-sm font-bold text-white shadow-sm"
                      >
                        詳細を確認
                      </Link>
                      <Link
                        href={`/test/report/pdf?date=${r.report_date}`}
                        className="inline-flex basis-1/2 justify-center items-center gap-2 rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm"
                      >
                        PDFプレビュー
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          {!loading && reports.length > 0 && filteredReports.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              条件に一致する履歴がありません。期間を変更してください。
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
