"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import FormSection from "@/components/ui/FormSection";
import Card from "@/components/ui/Card";
import PageActions from "@/components/ui/PageActions";
import StatusBadge from "@/components/ui/StatusBadge";
import PageTitle from "@/components/ui/PageTitle";
import { getDriverSessionId, clearDriverSession } from "@/lib/driver-session";
import { ClipboardPen, Eye, Van, FileText, UserRound, Pen } from "lucide-react";

type DriverFile = {
  id: number;
  driver_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
};

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl p-4 shadow space-y-3">
      <div className="border-b pb-2">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
      </div>
      {children}
    </section>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline border-b border-dotted border-mist-200">
      <span className="text-gray-500 text-sm">{label}</span>{" "}
      <span className="text-slate-900 text-right font-semibold text-lg">
        {value ?? "—"}
      </span>
    </div>
  );
}

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
  project_id: number;
  project_start_date?: string;
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
};
export default function DriverDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<DriverFile[]>([]);

  // ----------------------------
  // データ取得
  // ----------------------------
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data: driverData } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", id)
        .single();

      const { data: reportData } = await supabase
        .from("daily_reports")
        .select("*")
        .is("deleted_at", null)
        .eq("driver_id", id);

      const { data: projectData } = await supabase
        .from("projects")
        .select("id, name, current_unit_price");

      const { data: filesData } = await supabase
        .from("driver_files")
        .select("*")
        .eq("driver_id", id);

      setDriver(driverData);
      setReports(reportData ?? []);
      setProjects(projectData ?? []);
      setLoading(false);
      setFiles(filesData ?? []);
    };

    fetchData();
  }, [id]);

  if (loading) return <p className="p-6">読み込み中...</p>;
  if (!driver) return <p className="p-6">存在しません</p>;

  // ----------------------------
  // 集計（ここが正しい場所）
  // ----------------------------
  const workDays = new Set(reports.map((r) => r.report_date)).size;
  const absences = reports.filter((r) => r.work_status === "欠勤").length;
  const totalSales = reports.reduce(
    (sum, r) => sum + (r.delivery_count ?? 0) * (r.unit_price ?? 0),
    0,
  );

  const monthSales = reports
    .filter((r) => {
      const d = new Date(r.report_date);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    })
    .reduce((sum, r) => sum + (r.delivery_count ?? 0) * (r.unit_price ?? 0), 0);
  const projectName =
    projects.find((p) => p.id === driver.project_id)?.name ?? "-";

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

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <main className="p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
        <PageTitle>ドライバー詳細</PageTitle>
        {/* ヘッダー */}
        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
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

          {/* サマリー */}
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

          {/* 詳細情報 */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border border-mist-200">
              <FormSection icon={<UserRound size={24} />} title="個人情報" />
              <Row label="電話" value={driver.phone} />
              <Row label="メール" value={driver.email} />
              <Row label="生年月日" value={driver.birth_date} />
              <Row label="住所" value={driver.address} />
            </Card>

            <Card className="border border-mist-200">
              <FormSection icon={<Van size={24} />} title="車両情報" />
              <Row label="車種" value={driver.vehicle_type} />
              <Row label="ナンバー" value={driver.plate_number} />
            </Card>

            <Card className="border border-mist-200">
              <FormSection icon={<ClipboardPen size={24} />} title="案件情報" />
              <Row label="案件名" value={projectName} />
              <Row label="開始日" value={driver.project_start_date} />
            </Card>

            <Card className="border border-mist-200">
              <FormSection icon={<FileText size={24} />} title="登録済み書類" />
              {files.length === 0 ? (
                <div className="p-4 text-gray-500 text-slate-700">
                  書類はありません
                </div>
              ) : (
                files.map((f) => (
                  <div
                    key={f.id}
                    className="border-b flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-700">
                        {f.file_type}
                      </p>

                      <p className="text-sm text-gray-500 text-slate-700">
                        {f.file_name}
                      </p>
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
                ))
              )}
            </Card>
          </div>
        </Card>

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
