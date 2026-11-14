"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import FormSection from "@/components/ui/FormSection";
import Card from "@/components/ui/Card";
import PageActions from "@/components/ui/PageActions";
import StatusBadge from "@/components/ui/StatusBadge";
import PageTitle from "@/components/ui/PageTitle";
import {
  ClipboardPen,
  Eye,
  Van,
  FileText,
  UserRound,
  Pen,
  CalendarDays,
  Package,
  MapPin,
} from "lucide-react";

type DriverFile = {
  id: number;
  driver_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
};

type Driver = {
  id: number;
  name: string;
  status: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  birth_date?: string | null;
  vehicle_type?: string | null;
  plate_number?: string | null;
};

type Report = {
  id: number;
  driver_id: number;
  report_date: string;
  delivery_count: number | null;
  note: string | null;
  work_status: string | null;
  submitted_at: string | null;
};

type Project = {
  id: number;
  name: string;
  current_unit_price: number | null;
  delivery_area?: string | null;
  start_location?: string | null;
  end_location?: string | null;
};

type DriverProject = {
  project_id: number;
  projects: Project | Project[] | null;
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  const displayValue =
    value === null || value === undefined || value === "" ? "—" : value;

  return (
    <div className="flex justify-between items-start gap-4 border-b border-dotted border-slate-200 py-3 last:border-b-0">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>

      <span className="text-sm font-medium text-slate-800 text-right break-all">
        {displayValue}
      </span>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-");
  return `${year}/${month}/${day}`;
}

function formatYen(value: number | null | undefined) {
  return `¥${Number(value ?? 0).toLocaleString("ja-JP")}`;
}

export default function DriverDetail() {
  const params = useParams();
  const id = Number(params.id);

  const [driver, setDriver] = useState<Driver | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [files, setFiles] = useState<DriverFile[]>([]);
  const [driverProjects, setDriverProjects] = useState<DriverProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id || Number.isNaN(id)) {
        setLoading(false);
        setErrorMessage("ドライバーIDが正しくありません。");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const [
          { data: driverData, error: driverError },
          { data: reportData, error: reportError },
          { data: driverProjectsData, error: driverProjectsError },
          { data: filesData, error: filesError },
        ] = await Promise.all([
          supabase.from("drivers").select("*").eq("id", id).maybeSingle(),

          supabase
            .from("daily_reports")
            .select(
              "id, driver_id, report_date, delivery_count, note, work_status, submitted_at",
            )
            .is("deleted_at", null)
            .eq("driver_id", id)
            .order("report_date", { ascending: false }),

          supabase
            .from("driver_projects")
            .select(
              `
              project_id,
              projects (
                id,
                name,
                current_unit_price,
                delivery_area,
                start_location,
                end_location
              )
            `,
            )
            .eq("driver_id", id),

          supabase
            .from("driver_files")
            .select("*")
            .eq("driver_id", id)
            .order("id", { ascending: false }),
        ]);

        if (driverError) throw driverError;

        if (!driverData) {
          setDriver(null);
          return;
        }

        if (reportError) {
          console.error("日報取得エラー", reportError);
        }

        if (driverProjectsError) {
          console.error("ドライバー案件取得エラー", driverProjectsError);
        }

        if (filesError) {
          console.error("書類取得エラー", filesError);
        }

        setDriver(driverData as Driver);
        setReports((reportData ?? []) as Report[]);
        setDriverProjects((driverProjectsData ?? []) as DriverProject[]);
        setFiles((filesData ?? []) as DriverFile[]);
      } catch (error) {
        console.error("ドライバー詳細取得エラー", error);
        setErrorMessage("ドライバー情報を取得できませんでした。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const deleteFile = async (fileId: number) => {
    if (!confirm("この書類を削除しますか？")) return;

    const { error } = await supabase
      .from("driver_files")
      .delete()
      .eq("id", fileId);

    if (error) {
      alert(error.message);
      return;
    }

    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  if (loading) {
    return (
      <main className="p-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-slate-500">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="p-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <Card className="p-5">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </Card>
        </div>
      </main>
    );
  }

  if (!driver) {
    return (
      <main className="p-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <Card className="p-5">
            <p className="text-sm text-slate-500">ドライバーが存在しません。</p>
          </Card>
        </div>
      </main>
    );
  }

  // 稼働状況の集計
  const now = new Date();

  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;

  const currentMonthReports = reports.filter(
    (report) => report.report_date?.slice(0, 7) === currentMonth,
  );

  const workDays = new Set(
    reports
      .filter((report) => report.work_status !== "欠勤")
      .map((report) => report.report_date),
  ).size;

  const monthWorkDays = new Set(
    currentMonthReports
      .filter((report) => report.work_status !== "欠勤")
      .map((report) => report.report_date),
  ).size;

  const absences = reports.filter(
    (report) => report.work_status === "欠勤",
  ).length;

  const monthAbsences = currentMonthReports.filter(
    (report) => report.work_status === "欠勤",
  ).length;

  return (
    <main className="p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* ページタイトル */}
        <div className="space-y-3">
          <PageTitle>ドライバー詳細</PageTitle>

          <Card className="p-4 md:p-5 border border-slate-200 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={driver.status} />
                  <span className="text-xs text-slate-400">
                    ID #{driver.id}
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                  {driver.name}
                </h1>
              </div>

              <PageActions
                actions={[
                  {
                    type: "edit",
                    href: `/drivers/${id}/edit`,
                    label: "編集する",
                    icon: <Pen size={18} />,
                  },
                ]}
              />
            </div>
          </Card>
        </div>

        {/* 稼働状況 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-800">稼働状況</h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4 border border-slate-200 bg-white">
              <p className="text-xs text-slate-500">今月の稼働日数</p>
              <p className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">
                {monthWorkDays}
                <span className="text-sm font-normal ml-1">日</span>
              </p>
            </Card>

            <Card className="p-4 border border-slate-200 bg-white">
              <p className="text-xs text-slate-500">今月の欠勤</p>
              <p className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">
                {monthAbsences}
                <span className="text-sm font-normal ml-1">日</span>
              </p>
            </Card>

            <Card className="p-4 border border-slate-200 bg-white">
              <p className="text-xs text-slate-500">累計稼働日数</p>
              <p className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">
                {workDays}
                <span className="text-sm font-normal ml-1">日</span>
              </p>
            </Card>

            <Card className="p-4 border border-slate-200 bg-white">
              <p className="text-xs text-slate-500">累計欠勤</p>
              <p className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">
                {absences}
                <span className="text-sm font-normal ml-1">日</span>
              </p>
            </Card>
          </div>
        </section>

        {/* 基本情報 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-800">基本情報</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 md:p-5 border border-slate-200 bg-white">
              <FormSection icon={<UserRound size={20} />} title="個人情報" />

              <div className="mt-2">
                <Row label="氏名" value={driver.name} />
                <Row label="電話番号" value={driver.phone} />
                <Row label="メールアドレス" value={driver.email} />
                <Row label="生年月日" value={formatDate(driver.birth_date)} />
                <Row label="住所" value={driver.address} />
              </div>
            </Card>

            <Card className="p-4 md:p-5 border border-slate-200 bg-white">
              <FormSection icon={<Van size={20} />} title="車両情報" />

              <div className="mt-2">
                <Row label="車種" value={driver.vehicle_type} />
                <Row label="ナンバー" value={driver.plate_number} />
              </div>
            </Card>
          </div>
        </section>

        {/* 担当案件 */}
        <Card className="p-4 md:p-5 border border-slate-200 bg-white space-y-4">
          <FormSection icon={<ClipboardPen size={20} />} title="担当案件" />

          {driverProjects.length === 0 ? (
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-5 text-center text-sm text-slate-500">
              担当案件が登録されていません。
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {driverProjects.map((item) => {
                const project = Array.isArray(item.projects)
                  ? item.projects[0]
                  : item.projects;

                if (!project) return null;

                return (
                  <div
                    key={item.project_id}
                    className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Package size={18} className="text-slate-500 shrink-0" />
                      <h3 className="font-bold text-slate-800">
                        {project.name}
                      </h3>
                    </div>

                    <Row
                      label="単価"
                      value={formatYen(project.current_unit_price)}
                    />

                    <Row label="配送エリア" value={project.delivery_area} />

                    <Row label="出発場所" value={project.start_location} />

                    <Row label="帰着場所" value={project.end_location} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 日報履歴 */}
        <Card className="p-4 md:p-5 border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between gap-3">
            <FormSection icon={<CalendarDays size={20} />} title="日報履歴" />

            <span className="text-sm text-slate-500 shrink-0">
              {reports.length} 件
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-5 text-center text-sm text-slate-500">
              日報はまだ登録されていません。
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 20).map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="font-bold text-slate-800">
                      {formatDate(report.report_date)}
                    </p>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        report.work_status === "欠勤"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {report.work_status ?? "未設定"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">配達完了件数</p>
                      <p className="font-bold text-slate-800 mt-1">
                        {report.delivery_count ?? "—"}
                        {report.delivery_count !== null ? "件" : ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">提出状況</p>
                      <p className="font-bold text-slate-800 mt-1">
                        {report.submitted_at ? "提出済み" : "未提出"}
                      </p>
                    </div>
                  </div>

                  {report.note && (
                    <p className="text-sm text-slate-600 border-t border-slate-100 pt-3 whitespace-pre-wrap break-words">
                      {report.note}
                    </p>
                  )}

                  <div className="flex justify-end pt-1">
                    <PageActions
                      actions={[
                        {
                          type: "detail",
                          href: `/reports/${report.id}`,
                          label: "日報を見る",
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}

              {reports.length > 20 && (
                <p className="text-center text-xs text-slate-500 pt-1">
                  最新20件を表示しています。
                </p>
              )}
            </div>
          )}
        </Card>

        {/* 登録済み書類 */}
        <Card className="p-4 md:p-5 border border-slate-200 bg-white space-y-4">
          <FormSection icon={<FileText size={20} />} title="登録済み書類" />

          {files.length === 0 ? (
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-5 text-center text-sm text-slate-500">
              登録されている書類はありません。
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800">
                      {file.file_type}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-1">
                      {file.file_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="書類を開く"
                    >
                      <Eye size={18} />
                    </a>

                    <button
                      type="button"
                      onClick={() => deleteFile(file.id)}
                      className="text-xs font-medium text-red-600 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 戻る */}
        <div className="w-24">
          <PageActions
            actions={[
              {
                type: "back",
                href: "/drivers",
                label: "戻る",
                className: "!w-full",
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
