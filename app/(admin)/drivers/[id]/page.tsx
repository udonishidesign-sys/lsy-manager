"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import FormSection from "@/components/ui/FormSection";
import Card from "@/components/ui/Card";
import PageActions from "@/components/ui/PageActions";
import StatusBadge from "@/components/ui/StatusBadge";
import PageTitle from "@/components/ui/PageTitle";
import { ClipboardPen, Eye, Van, FileText, UserRound, Pen } from "lucide-react";

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
  phone?: string;
  email?: string;
  address?: string;
  birth_date?: string;
  vehicle_type?: string;
  plate_number?: string;
};

type Report = {
  id: number;
  driver_id: number;
  report_date: string;
  delivery_count: number;
  unit_price: number;
  sales: number;
  note: string | null;
  work_status: "出勤" | "欠勤" | null;
};

type Project = {
  id: number;
  name: string;
  current_unit_price: number;
  delivery_area?: string | null;
  start_location?: string | null;
  end_location?: string | null;
};

type DriverProject = {
  project_id: number;
  projects: Project | Project[] | null;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline border-b border-dotted border-mist-200 py-2">
      <span className="text-gray-500 text-sm">{label}</span>

      <span className="text-slate-900 text-right font-semibold text-base">
        {value || "—"}
      </span>
    </div>
  );
}

export default function DriverDetail() {
  const params = useParams();
  const id = Number(params.id);

  const [driver, setDriver] = useState<Driver | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [files, setFiles] = useState<DriverFile[]>([]);
  const [driverProjects, setDriverProjects] = useState<DriverProject[]>([]);
  const [loading, setLoading] = useState(true);

  // --------------------------------
  // データ取得
  // --------------------------------
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);

      // -----------------------------
      // ドライバー
      // -----------------------------
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", id)
        .single();

      if (driverError) {
        console.error("driver取得エラー", driverError);
        setLoading(false);
        return;
      }

      // -----------------------------
      // 日報
      // -----------------------------
      const { data: reportData, error: reportError } = await supabase
        .from("daily_reports")
        .select("*")
        .is("deleted_at", null)
        .eq("driver_id", id)
        .order("report_date", {
          ascending: false,
        });

      if (reportError) {
        console.error("日報取得エラー", reportError);
      }

      // -----------------------------
      // ドライバー × 案件
      // -----------------------------
      const { data: driverProjectsData, error: driverProjectsError } =
        await supabase
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
          .eq("driver_id", id);

      if (driverProjectsError) {
        console.error("ドライバー案件取得エラー", driverProjectsError);
      }

      // -----------------------------
      // ドライバー書類
      // -----------------------------
      const { data: filesData, error: filesError } = await supabase
        .from("driver_files")
        .select("*")
        .eq("driver_id", id);

      if (filesError) {
        console.error("書類取得エラー", filesError);
      }

      setDriver(driverData);
      setReports(reportData ?? []);
      setDriverProjects((driverProjectsData as DriverProject[]) ?? []);
      setFiles(filesData ?? []);

      setLoading(false);
    };

    fetchData();
  }, [id]);

  // --------------------------------
  // ローディング
  // --------------------------------
  if (loading) {
    return <p className="p-6">読み込み中...</p>;
  }

  if (!driver) {
    return <p className="p-6">存在しません</p>;
  }

  // --------------------------------
  // 集計
  // --------------------------------
  const workDays = new Set(reports.map((r) => r.report_date)).size;

  const absences = reports.filter((r) => r.work_status === "欠勤").length;

  const totalSales = reports.reduce(
    (sum, r) => sum + (r.delivery_count ?? 0) * (Number(r.unit_price) || 0),
    0,
  );

  const now = new Date();

  const monthSales = reports
    .filter((r) => {
      const d = new Date(r.report_date);

      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    })
    .reduce(
      (sum, r) => sum + (r.delivery_count ?? 0) * (Number(r.unit_price) || 0),
      0,
    );

  // --------------------------------
  // 書類削除
  // --------------------------------
  const deleteFile = async (fileId: number) => {
    const ok = confirm("削除しますか？");

    if (!ok) return;

    const { error } = await supabase
      .from("driver_files")
      .delete()
      .eq("id", fileId);

    if (error) {
      alert(error.message);
      return;
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // --------------------------------
  // UI
  // --------------------------------
  return (
    <main className="p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
        <PageTitle>ドライバー詳細</PageTitle>

        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          {/* -------------------------------- */}
          {/* ヘッダー */}
          {/* -------------------------------- */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge status={driver.status} />

                <p className="text-slate-300">ドライバーID #{driver.id}</p>
              </div>

              <h1 className="text-3xl font-bold text-slate-900">
                {driver.name}
              </h1>
            </div>

            <div className="flex gap-3">
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
          </div>

          {/* -------------------------------- */}
          {/* サマリー */}
          {/* -------------------------------- */}
          <div className="grid md:grid-cols-4 grid-cols-2 gap-4">
            <Card className="border border-mist-200">
              <p className="text-sm text-slate-500">今月売上</p>

              <p className="text-2xl font-bold mt-2 text-slate-500">
                ¥{monthSales.toLocaleString()}
              </p>
            </Card>

            <Card className="border border-mist-200">
              <p className="text-sm text-slate-500">累計売上</p>

              <p className="text-2xl font-bold mt-2 text-slate-500">
                ¥{totalSales.toLocaleString()}
              </p>
            </Card>

            <Card className="border border-mist-200">
              <p className="text-sm text-slate-500">稼働日数</p>

              <p className="text-2xl font-bold mt-2 text-slate-500">
                {workDays}日
              </p>
            </Card>

            <Card className="border border-mist-200">
              <p className="text-sm text-slate-500">欠勤</p>

              <p className="text-2xl font-bold mt-2 text-slate-500">
                {absences}日
              </p>
            </Card>
          </div>

          {/* -------------------------------- */}
          {/* 詳細情報 */}
          {/* -------------------------------- */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* ============================== */}
            {/* 個人情報 */}
            {/* ============================== */}
            <Card className="border border-mist-200">
              <FormSection icon={<UserRound size={24} />} title="個人情報" />

              <Row label="電話" value={driver.phone} />

              <Row label="メール" value={driver.email} />

              <Row label="生年月日" value={driver.birth_date} />

              <Row label="住所" value={driver.address} />
            </Card>

            {/* ============================== */}
            {/* 車両情報 */}
            {/* ============================== */}
            <Card className="border border-mist-200">
              <FormSection icon={<Van size={24} />} title="車両情報" />

              <Row label="車種" value={driver.vehicle_type} />

              <Row label="ナンバー" value={driver.plate_number} />
            </Card>

            {/* ============================== */}
            {/* 案件情報 */}
            {/* ============================== */}
            <Card className="border border-mist-200">
              <FormSection icon={<ClipboardPen size={24} />} title="案件情報" />

              {driverProjects.length === 0 ? (
                <div className="py-4 text-sm text-gray-500">
                  案件が登録されていません
                </div>
              ) : (
                <div className="space-y-4">
                  {driverProjects.map((item) => {
                    const project = Array.isArray(item.projects)
                      ? item.projects[0]
                      : item.projects;

                    if (!project) return null;

                    return (
                      <div
                        key={item.project_id}
                        className="rounded-xl bg-slate-50 border border-mist-200 p-4"
                      >
                        {/* 案件名 */}
                        <div className="mb-3">
                          <p className="text-xs text-gray-500">案件名</p>

                          <p className="text-xl font-bold text-slate-800">
                            {project.name}
                          </p>
                        </div>

                        {/* 単価 */}
                        <Row
                          label="単価"
                          value={`¥${Number(
                            project.current_unit_price ?? 0,
                          ).toLocaleString()}`}
                        />

                        {/* 配送エリア */}
                        <Row label="配送エリア" value={project.delivery_area} />

                        {/* 出発場所 */}
                        <Row label="出発場所" value={project.start_location} />

                        {/* 帰着場所 */}
                        <Row label="帰着場所" value={project.end_location} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* ============================== */}
            {/* 登録済み書類 */}
            {/* ============================== */}
            <Card className="border border-mist-200">
              <FormSection icon={<FileText size={24} />} title="登録済み書類" />

              {files.length === 0 ? (
                <div className="p-4 text-gray-500 text-slate-700">
                  書類はありません
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="border-b flex items-center justify-between py-2"
                    >
                      <div>
                        <p className="font-medium text-slate-700">
                          {f.file_type}
                        </p>

                        <p className="text-sm text-gray-500">{f.file_name}</p>
                      </div>

                      <PageActions
                        actions={[
                          {
                            type: "detail",
                            href: f.file_url,
                            target: "_blank",
                            label: "",
                            icon: <Eye size={20} />,
                          },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </Card>

        {/* -------------------------------- */}
        {/* 戻る */}
        {/* -------------------------------- */}
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
