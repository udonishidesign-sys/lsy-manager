"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatYen } from "@/lib/drivers";
import Card from "@/components/ui/Card";
import PageTitle from "@/components/ui/PageTitle";
import PageActions from "@/components/ui/PageActions";
import FormSection from "@/components/ui/FormSection";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import {
  ClipboardPen,
  Package,
  Van,
  FileText,
  Clock,
  CircleCheckBig,
  Pen,
  CalendarCheck,
} from "lucide-react";

type Report = {
  id: number;
  driver_id: number;
  project_id: number;
  plate_number: string | null;
  report_date: string;
  delivery_count: number;
  returned_delivery_count: number;
  delivery_area: string | null;
  unit_price: number;
  note: string | null;
  work_status: "出勤" | "欠勤" | null;
  attachment_url: string | null;
  start_time: string | null;
  end_time: string | null;
  start_location: string | null;
  end_location: string | null;
  break_start: string | null;
  break_end: string | null;
  odometer_start: number | null;
  odometer_end: number | null;
  carry_out_am: number | null;
  carry_out_pm: number | null;
  carry_back_am: number | null;
  carry_back_pm: number | null;
  last_delivery_am: string | null;
  last_delivery_pm: string | null;
  eiaj_am: number | null;
  eiaj_pm: number | null;
  collection_am: number | null;
  collection_pm: number | null;
  collection_count: number | null;
  check_brake: boolean | null;
  check_tire: boolean | null;
  check_light: boolean | null;
  check_wiper: boolean | null;
  check_drive_recorder: boolean | null;
  check_engine: boolean | null;
  check_handle: boolean | null;
  check_horn: boolean | null;
  check_turn_signal: boolean | null;
  check_battery: boolean | null;
  check_emergency_signal: boolean | null;
  check_fuel: boolean | null;
  check_coolant: boolean | null;
  check_oil: boolean | null;
  check_license_plate: boolean | null;
  check_vehicle_inspection: boolean | null;
  check_insurance: boolean | null;
  alcohol_check_time: string | null;
  alcohol_check_image_url: string | null;
};

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [report, setReport] = useState<Report | null>(null);
  const [driverName, setDriverName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [workStatus, setworkStatus] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  // ----------------------------
  // データ取得
  // ----------------------------
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        console.error(error);
        return;
      }

      setReport(data);

      // driver取得
      const { data: driverData } = await supabase
        .from("drivers")
        .select("name")
        .eq("id", data.driver_id)
        .single();

      // project取得
      const { data: projectData } = await supabase
        .from("projects")
        .select("name")
        .eq("id", data.project_id)
        .single();

      setDriverName(driverData?.name ?? "不明");
      setProjectName(projectData?.name ?? "不明");
      setPlateNumber(data.plate_number ?? "");
      setDeliveryArea(data.delivery_area ?? "");
    };

    fetchData();
  }, [id]);

  // ----------------------------
  // ロード中
  // ----------------------------
  if (!report) {
    return (
      <main className="p-4">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }
  const sales = (report.delivery_count ?? 0) * (report.unit_price ?? 0);
  const distance = Math.max(
    (report.odometer_end ?? 0) - (report.odometer_start ?? 0),
    0,
  );
  const isShein = projectName === "SHEIN";
  const checked = (value: boolean | null) => (value ? "済" : "未確認");

  // ----------------------------
  // 削除（論理削除）
  // ----------------------------
  const deleteReport = async () => {
    const ok = confirm("この日報を削除しますか？");
    if (!ok) return;

    const { error } = await supabase
      .from("daily_reports")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("削除しました");
    router.push("/reports");
  };
  function formatTime(value: string | null) {
    if (!value) return "-";
    return value.slice(0, 5);
  }

  function DetailRow({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) {
    return (
      <div className="flex justify-between items-baseline border-b border-dotted border-mist-200">
        <span className="text-gray-500 text-sm">{label}</span>{" "}
        <span className="text-slate-900 text-right font-semibold text-lg">
          {value ?? "—"}
        </span>
      </div>
    );
  }

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <main className="px-4 pt-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <PageTitle>日報詳細</PageTitle>
        </div>
        <Card className="space-y-4 p-6 bg-white/50">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex gap-2 items-center text-lg font-bold text-slate-500">
                <CalendarCheck size={24} />
                {report.report_date}
              </div>
              <div className="flex gap-3 items-center">
                <StatusBadge status={report.work_status ?? ""} />
                <h1 className="text-3xl font-bold text-slate-900">
                  {driverName}
                </h1>
              </div>
            </div>
            {/* <div className="flex gap-3">
              <PageActions
                actions={[
                  {
                    type: "edit",
                    href: `/reports/${report.id}/edit`,
                    label: "編集する",
                    icon: <Pen size={18} />,
                  },
                ]}
              />
              <Button variant="delete" onClick={deleteReport} iconOnly></Button>
            </div> */}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card className="border border-mist-200">
                <FormSection
                  icon={<ClipboardPen size={24} />}
                  title="勤務情報"
                />
                <DetailRow label="案件" value={projectName} />
                <DetailRow
                  label="車両ナンバー"
                  value={report.plate_number ?? "未登録"}
                />
              </Card>
              {/* アルコールチェック */}
              <Card className="border border-mist-200">
                <FormSection
                  icon={<ClipboardPen size={24} />}
                  title="アルコールチェック"
                />
                <DetailRow
                  label="チェック時間"
                  value={formatTime(report.alcohol_check_time)}
                />
                {report.alcohol_check_image_url ? (
                  <div className="mt-2">
                    <a
                      href={report.alcohol_check_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-teal-600 underline"
                    >
                      登録済み写真を見る
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mt-2">写真なし</p>
                )}
              </Card>

              <Card className="border border-mist-200">
                <FormSection
                  icon={<CircleCheckBig size={24} />}
                  title="運行前点検"
                />

                <div className="text-sm text-slate-600 space-y-1.5">
                  <p>ブレーキ: {checked(report.check_brake)}</p>
                  <p>原動機: {checked(report.check_engine)}</p>
                  <p>ハンドル: {checked(report.check_handle)}</p>
                  <p>タイヤ: {checked(report.check_tire)}</p>
                  <p>ワイパー: {checked(report.check_wiper)}</p>
                  <p>クラクション: {checked(report.check_horn)}</p>
                  <p>ウィンカー: {checked(report.check_turn_signal)}</p>
                  <p>バッテリー: {checked(report.check_battery)}</p>
                  <p>灯火装置: {checked(report.check_light)}</p>
                  <p>非常用信号: {checked(report.check_emergency_signal)}</p>
                  <p>燃料: {checked(report.check_fuel)}</p>
                  <p>冷却水: {checked(report.check_coolant)}</p>
                  <p>オイル: {checked(report.check_oil)}</p>
                  <p>登録番号表: {checked(report.check_license_plate)}</p>
                  <p>検査証: {checked(report.check_vehicle_inspection)}</p>
                  <p>保険証: {checked(report.check_insurance)}</p>
                  <p>ドラレコ: {checked(report.check_drive_recorder)}</p>
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="border border-mist-200">
                <FormSection icon={<Van size={24} />} title="走行情報" />
                <DetailRow
                  label="配送エリア"
                  value={report.delivery_area ?? "-"}
                />
                <div className="grid grid-cols-2 gap-6">
                  <DetailRow
                    label="出発場所"
                    value={report.start_location ?? "-"}
                  />

                  <DetailRow
                    label="帰ってきた場所"
                    value={report.end_location ?? "-"}
                  />
                  <DetailRow
                    label="出庫メーター"
                    value={`${report.odometer_start ?? 0}km`}
                  />
                  <DetailRow
                    label="帰庫メーター"
                    value={`${report.odometer_end ?? 0}km`}
                  />
                </div>

                <div className="bg-slate-100 rounded-lg p-3 flex justify-between">
                  <span className="text-slate-500">走行距離</span>
                  <span className="font-bold text-slate-700">
                    {distance.toLocaleString()} km
                  </span>
                </div>
              </Card>
              <Card className="border border-mist-200">
                <FormSection icon={<Clock size={24} />} title="勤務時間" />
                <div className="grid grid-cols-2 gap-6">
                  <DetailRow
                    label="業務開始時間"
                    value={formatTime(report.start_time)}
                  />
                  <DetailRow
                    label="業務終了時間"
                    value={formatTime(report.end_time)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <DetailRow
                    label="休憩開始"
                    value={formatTime(report.break_start)}
                  />
                  <DetailRow
                    label="休憩終了"
                    value={formatTime(report.break_end)}
                  />
                </div>
              </Card>
              <Card className="border border-mist-200">
                <FormSection icon={<Package size={24} />} title="配送実績" />
                <DetailRow
                  label="配達完了件数"
                  value={`${(report.delivery_count ?? 0).toLocaleString()} 件`}
                />

                <div className="bg-slate-100 rounded-lg p-3">
                  <div className="flex justify-between text-slate-700">
                    <span>単価</span>
                    <span>{formatYen(report.unit_price)}</span>
                  </div>

                  <div className="flex justify-between font-semibold mt-2 text-slate-700">
                    <span>売上</span>
                    <span>{formatYen(sales)}</span>
                  </div>
                </div>
                {isShein && (
                  <DetailRow
                    label="不在持ち帰り件数"
                    value={`${report.returned_delivery_count ?? 0}件`}
                  />
                )}
                <DetailRow
                  label="伝票枚数"
                  value={`${(report.carry_out_am ?? 0).toLocaleString()} 件`}
                />
              </Card>

              <Card className="border border-mist-200">
                <DetailRow label="備考" value={report.note || "-"} />

                <div>
                  <p className="block text-sm text-gray-500 mb-1">
                    添付ファイル
                  </p>
                  {report.attachment_url ? (
                    <a
                      href={report.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 underline font-semibold"
                    >
                      ファイルを開く
                    </a>
                  ) : (
                    <p className="text-slate-700">-</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </Card>
        <div className="w-24">
          <PageActions
            actions={[
              {
                type: "back",
                href: "/reports",
                label: "戻る",
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
