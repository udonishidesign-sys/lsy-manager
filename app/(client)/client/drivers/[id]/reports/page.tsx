"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserRound, Calendar, Package, ChevronLeft } from "lucide-react";

type Driver = {
  id: number;
  name: string;
};

type Report = {
  id: number;
  driver_id: number;
  project_id: number;
  report_date: string;
  delivery_count: number | null;
  work_status: string | null;
};

type Project = {
  id: number;
  name: string;
  client_id: number;
};

export default function ClientDriverReportsPage() {
  const router = useRouter();
  const params = useParams();

  const driverId = Number(params.id);

  const [driver, setDriver] = useState<Driver | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [project, setProject] = useState<Project | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const monthInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [selectedMonth]);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError("");

      if (!driverId || Number.isNaN(driverId)) {
        setError("ドライバー情報が正しくありません。");
        setLoading(false);
        return;
      }

      // =========================================================
      // ログイン確認
      // =========================================================

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/login");
        return;
      }

      // =========================================================
      // ログイン中の受託先を取得
      // =========================================================

      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", session.user.email)
        .single();

      if (clientError || !client) {
        console.error(clientError);

        setError(`受託先情報を取得できませんでした。`);

        setLoading(false);
        return;
      }

      // =========================================================
      // ドライバー取得
      //
      // drivers.client_id とログイン中の受託先を確認
      // =========================================================

      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("id, name")
        .eq("id", driverId)
        .eq("client_id", client.id)
        .single();

      if (driverError || !driverData) {
        console.error(driverError);

        setError("このドライバーの日報を閲覧する権限がありません。");

        setLoading(false);
        return;
      }

      setDriver(driverData);

      // =========================================================
      // 受託先に紐づく案件を取得
      //
      // 1受託先 = 1案件
      //
      // projects.client_id で紐付ける
      // =========================================================

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, name, client_id")
        .eq("client_id", client.id)
        .maybeSingle();

      if (projectError) {
        console.error(projectError);

        setError("案件情報を取得できませんでした。");
        setLoading(false);
        return;
      }

      if (!projectData) {
        setError("この受託先に紐づく案件がありません。");
        setLoading(false);
        return;
      }

      setProject(projectData);

      // =========================================================
      // ドライバーがその案件を担当しているか確認
      //
      // driver_projects
      // driver_id + project_id
      // =========================================================

      const { data: driverProject, error: driverProjectError } = await supabase
        .from("driver_projects")
        .select("project_id")
        .eq("driver_id", driverId)
        .eq("project_id", projectData.id)
        .maybeSingle();

      if (driverProjectError) {
        console.error(driverProjectError);

        setError("ドライバーの担当案件情報を確認できませんでした。");
        setLoading(false);
        return;
      }

      if (!driverProject) {
        setError("このドライバーは現在、この受託先の案件を担当していません。");
        setLoading(false);
        return;
      }

      // =========================================================
      // 月の範囲を作成
      //
      // selectedMonth = "2026-09"
      //
      // 2026-09-01 ～ 2026-09-30
      // =========================================================

      const [year, month] = selectedMonth.split("-").map(Number);

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

      const lastDay = new Date(year, month, 0).getDate();

      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
        lastDay,
      ).padStart(2, "0")}`;

      // =========================================================
      // 日報取得
      //
      // ドライバーID
      // ＋
      // 受託先の案件ID
      // ＋
      // 選択した月
      //
      // この3条件で絞り込む
      // =========================================================

      const { data: reportsData, error: reportsError } = await supabase
        .from("daily_reports")
        .select(
          `
            id,
            driver_id,
            project_id,
            report_date,
            delivery_count,
            work_status
          `,
        )
        .eq("driver_id", driverId)
        .eq("project_id", projectData.id)
        .gte("report_date", startDate)
        .lte("report_date", endDate)
        .is("deleted_at", null)
        .order("report_date", { ascending: false });

      if (reportsError) {
        console.error(reportsError);

        setError("日報を取得できませんでした。");
        setLoading(false);
        return;
      }

      setReports(reportsData ?? []);
      setLoading(false);
    };

    loadReports();
  }, [driverId, router, selectedMonth]);

  // =========================================================
  // ページネーション
  // =========================================================

  const totalPages = Math.max(Math.ceil(reports.length / pageSize), 1);

  const start = (page - 1) * pageSize;

  const paginatedReports = reports.slice(start, start + pageSize);

  // =========================================================
  // 読み込み中
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 pt-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </main>
    );
  }

  // =========================================================
  // エラー
  // =========================================================

  if (error) {
    return (
      <main className="min-h-screen bg-white px-4 pt-24">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl bg-red-50 border border-red-200 p-5">
            <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>

            <button
              type="button"
              onClick={() => router.push("/client")}
              className="mt-4 px-4 py-2 rounded-lg bg-teal-500 text-white font-bold hover:cursor-pointer"
            >
              ログインする
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* =====================================================
            ヘッダー
        ===================================================== */}

        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/client")}
              className="flex items-center gap-1 text-sm text-teal-600 mb-3 hover:cursor-pointer"
            >
              <ChevronLeft size={18} />
              ドライバー一覧
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center">
                <UserRound size={24} className="text-teal-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {driver?.name}
                </h1>

                <p className="text-sm text-gray-500">日報一覧</p>
              </div>
            </div>
          </div>

          <span className="text-sm text-gray-500">{reports.length}件</span>
        </div>

        {/* =====================================================
            月選択
        ===================================================== */}

        <div className="bg-white border border-mist-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1.5">
                <Calendar size={20} className="text-teal-500" />
                <label className="block text-sm text-gray-500">対象月</label>
              </div>

              <input
                ref={monthInputRef}
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setPage(1);
                }}
                onClick={() => {
                  if (monthInputRef.current?.showPicker) {
                    monthInputRef.current.showPicker();
                  }
                }}
                className="border p-2 rounded-lg w-full min-w-0 max-w-full box-border bg-white text-gray-600 border-mist-200"
              />
            </div>
          </div>
        </div>

        {/* =====================================================
            日報一覧
        ===================================================== */}

        <div className="bg-white border border-mist-200 rounded-xl overflow-hidden shadow-sm">
          {/* PCヘッダー */}

          <div className="hidden md:flex bg-mist-200 px-4 py-3">
            <p className="font-semibold text-gray-600 w-1/4 flex items-center gap-1">
              日付
            </p>

            <p className="font-semibold text-gray-600 w-1/4 flex items-center gap-1">
              配送数
            </p>

            <p className="font-semibold text-gray-600 w-1/4">勤務区分</p>

            <p className="font-semibold text-gray-600 w-1/4">詳細</p>
          </div>

          {/* 日報なし */}

          {paginatedReports.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">
                {selectedMonth.replace("-", "年")}月の日報はありません。
              </p>
            </div>
          ) : (
            paginatedReports.map((report) => (
              <div
                key={report.id}
                className="border-b last:border-none px-4 py-4 md:py-3"
              >
                {/* =================================================
                    PC
                ================================================= */}

                <div className="hidden md:flex items-center">
                  <p className="text-gray-700 w-1/4">{report.report_date}</p>

                  <p className="text-gray-700 w-1/4">
                    {report.delivery_count ?? 0}件
                  </p>

                  <p className="text-gray-700 w-1/4">
                    {report.work_status || "-"}
                  </p>

                  <div className="w-1/4">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/client/drivers/${driverId}/reports/${report.id}`,
                        )
                      }
                      className="text-sm text-teal-600 hover:underline hover:cursor-pointer"
                    >
                      詳細
                    </button>
                  </div>
                </div>

                {/* =================================================
                    スマホ
                ================================================= */}

                <div className="md:hidden space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      日付
                    </span>

                    <span className="text-gray-700 font-medium">
                      {report.report_date}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      配送数
                    </span>

                    <span className="text-gray-700">
                      {report.delivery_count ?? 0}件
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">勤務区分</span>

                    <span className="text-gray-700">
                      {report.work_status || "-"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/client/drivers/${driverId}/reports/${report.id}`,
                      )
                    }
                    className="w-full mt-3 py-2 rounded-lg border border-teal-500 text-teal-600 font-bold hover:cursor-pointer"
                  >
                    詳細を見る
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* =====================================================
            ページネーション
        ===================================================== */}

        {reports.length > 0 && (
          <div className="flex justify-center items-center gap-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              前へ
            </button>

            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer hover:cursor-pointer"
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
