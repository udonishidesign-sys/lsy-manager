"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatYen } from "@/lib/drivers";
import Card from "@/components/ui/Card";
import FormSection from "@/components/ui/FormSection";
import Button from "@/components/ui/Button";
import PageTitle from "@/components/ui/PageTitle";
import {
  ClipboardPen,
  Package,
  Van,
  Clock,
  CircleCheckBig,
  ChevronDown,
} from "lucide-react";

type Report = {
  id: number;
  report_date: string;
  project_id: number;
  plate_number: string | null;
  delivery_count: number;
  returned_delivery_count: number | null;
  delivery_area: string | null;
  unit_price: number;
  work_status: string;
  absence_reason: string | null;
  note: string | null;
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
  const reportId = Number(params.id);
  const [report, setReport] = useState<Report | null>(null);
  const [projectName, setProjectName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", reportId)
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setReport(data);

      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", data.project_id)
        .single();
      setProjectName(project?.name ?? "不明");
      setPlateNumber(data.plate_number ?? "");
      setDeliveryArea(data.delivery_area ?? "");
      setStartLocation(data.start_location ?? "");
      setEndLocation(data.end_location ?? "");
    };

    fetchReport();
  }, [reportId]);

  if (!report) {
    return (
      <main className="p-4">
        {" "}
        <p>読み込み中...</p>{" "}
      </main>
    );
  }

  const sales = (report.delivery_count ?? 0) * (report.unit_price ?? 0);
  const mileage = (report.odometer_end ?? 0) - (report.odometer_start ?? 0);
  const isShein = projectName === "SHEIN";

  function DetailField({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) {
    return (
      <div>
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="w-full min-h-12 rounded-lg bg-mist-100/50 px-4 py-3 text-slate-700">
          {value}
        </p>
      </div>
    );
  }
  function formatTime(value: string | null) {
    if (!value) return "-";
    return value.slice(0, 5);
  }
  const checked = (value: boolean | null) => (value ? "済" : "未確認");

  return (
    <main className="px-4 pt-24 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          {/* 入力カード */}
          <PageTitle>日報詳細</PageTitle>
          <Link href="/report/history" className="text-sm text-slate-500">
            戻る
          </Link>
        </div>

        <Card>
          <FormSection icon={<ClipboardPen size={24} />} title="勤務情報" />
          <DetailField label="案件" value={projectName} />
          <DetailField
            label="車両ナンバー"
            value={report.plate_number ?? "未登録"}
          />
          <DetailField label="日付" value={report.report_date} />
          <DetailField label="出勤区分" value={report.work_status} />
          {report.work_status === "欠勤" && (
            <DetailField
              label="欠勤理由"
              value={report.absence_reason ?? "-"}
            />
          )}
        </Card>

        {report.work_status !== "欠勤" && (
          <>
            {/* アルコールチェック */}
            <Card>
              <FormSection
                icon={<ClipboardPen size={24} />}
                title="アルコールチェック"
              />
              <DetailField
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

            {/* 運行前点検 */}
            <Card>
              <details className="bg-white">
                <summary className="list-none cursor-pointer flex justify-between items-center">
                  <span className="flex justify-between gap-2 text-slate-700 font-bold">
                    <CircleCheckBig size={24} className="text-teal-500" />
                    運行前点検
                  </span>
                  <ChevronDown className="text-teal-500" />
                </summary>
                <div className="space-y-3 border-t border-teal-500 mt-2 pt-4">
                  <div className="grid grid-cols-2 gap-2.5 text-sm text-slate-600">
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
                </div>
              </details>
            </Card>

            {/* 走行情報 */}
            <Card>
              <FormSection icon={<Van size={24} />} title="走行情報" />
              <DetailField
                label="配送エリア"
                value={report.delivery_area ?? "-"}
              />
              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  label="出発場所"
                  value={report.start_location ?? "-"}
                />
                <DetailField
                  label="帰着場所"
                  value={report.end_location ?? "-"}
                />
                <DetailField
                  label="出庫メーター"
                  value={`${report.odometer_start ?? 0}km`}
                />
                <DetailField
                  label="帰庫メーター"
                  value={`${report.odometer_end ?? 0}km`}
                />
              </div>
              <div className="bg-slate-100 rounded-lg p-3 flex justify-between">
                <span className="text-slate-500">走行距離</span>
                <span className="font-bold text-slate-700">
                  {mileage.toLocaleString()} km
                </span>
              </div>
            </Card>

            {/* 勤務時間 */}
            <Card>
              <FormSection icon={<Clock size={24} />} title="勤務時間" />

              <div className="space-y-3">
                <DetailField
                  label="業務開始時間"
                  value={formatTime(report.start_time)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <DetailField
                    label="休憩開始"
                    value={formatTime(report.break_start)}
                  />
                  <DetailField
                    label="休憩終了"
                    value={formatTime(report.break_end)}
                  />
                </div>
                <DetailField
                  label="業務終了時間"
                  value={formatTime(report.end_time)}
                />
              </div>
            </Card>

            {/* 配送実績 */}
            <Card>
              <FormSection icon={<Package size={24} />} title="配送実績" />
              <DetailField
                label="配達完了件数"
                value={`${report.delivery_count ?? 0}件`}
              />
              <div className="bg-slate-100 rounded-lg p-3">
                <div className="flex justify-between text-slate-700">
                  <span>単価</span>
                  <span>{formatYen(report.unit_price ?? 0)}</span>
                </div>
                <div className="flex justify-between font-semibold mt-2 text-slate-700">
                  <span>売上</span>
                  <span>{formatYen(sales)}</span>
                </div>
              </div>
              {isShein && (
                <DetailField
                  label="不在持ち帰り件数"
                  value={`${report.returned_delivery_count ?? 0}件`}
                />
              )}
              <DetailField
                label="伝票枚数"
                value={`${report.carry_out_am ?? 0}枚`}
              />
            </Card>
          </>
        )}

        <Card>
          <DetailField label="備考" value={report.note ?? "-"} />
        </Card>
        <Link href={`/report/history/${report.id}/edit`} className="w-full">
          <Button className="w-full">編集する</Button>
        </Link>
      </div>
    </main>
  );
}
