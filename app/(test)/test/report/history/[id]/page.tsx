"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
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
  CheckCircle2,
  ChevronDown,
  FileText,
  CircleX,
  ClipboardCheck,
} from "lucide-react";

type Report = {
  id: number;
  driver_id: number;
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
  actual_start_location: string | null;
  actual_end_location: string | null;
  main_transit_points: string | null;
  break_sleep_records: string | null;
  driver_change_records: string | null;
  waiting_records: string | null;
  cargo_handling_records: string | null;
  incident_records: string | null;
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

type VehicleCheck = {
  check_date: string;
  alcohol_check_time: string | null;
  alcohol_check_image_url: string | null;
  temperature_check_value: number | null;
  temperature_check_image_url: string | null;
  vehicle_photos: Record<string, string> | null;
  [key: string]: unknown;
};

const vehicleCheckItems = [
  { key: "check_brake", label: "ブレーキ（効き具合・液量）" },
  { key: "check_tire", label: "タイヤ（空気圧・摩耗・損傷）" },
  { key: "check_handle", label: "ハンドル（操作・がたつき）" },
  { key: "check_mirror", label: "ミラー（角度・汚れ・損傷）" },
  { key: "check_wiper", label: "ワイパー（動作・ゴム状態）" },
  { key: "check_headlight", label: "ライト（前照灯・尾灯）" },
  { key: "check_turn_signal", label: "ウインカー（左右動作確認）" },
  { key: "check_hazard", label: "ハザード（動作確認）" },
  { key: "check_horn", label: "ホーン（動作確認）" },
  { key: "check_drive_recorder", label: "ドラレコ（動作確認）" },
  { key: "check_oil", label: "エンジンオイル（量・汚れ）" },
  { key: "check_coolant", label: "冷却水（量）" },
  { key: "check_battery", label: "バッテリー（液量・端子）" },
  { key: "check_fuel", label: "燃料（残量・漏れ）" },
  { key: "check_engine", label: "原動機（始動・異音・漏れ）" },
  { key: "check_light", label: "灯火装置（点灯・点滅）" },
  { key: "check_emergency_signal", label: "非常用信号（有無・期限）" },
  { key: "check_license_plate", label: "登録番号表（汚れ・損傷）" },
  { key: "check_vehicle_inspection", label: "検査証（備え付け・期限）" },
  { key: "check_insurance", label: "保険証（備え付け・期限）" },
  { key: "check_cargo_area", label: "荷室（清掃・損傷）" },
  { key: "check_load_condition", label: "積載状態（固定・バランス）" },
];

const vehiclePhotoItems = [
  { key: "tire_front_left", label: "タイヤ左前" },
  { key: "tire_front_right", label: "タイヤ右前" },
  { key: "tire_rear_left", label: "タイヤ左後" },
  { key: "tire_rear_right", label: "タイヤ右後" },
  { key: "vehicle_front", label: "車両前面" },
  { key: "vehicle_rear", label: "車両後面" },
  { key: "vehicle_left", label: "車両左側面" },
  { key: "vehicle_right", label: "車両右側面" },
  { key: "cargo_area", label: "荷室" },
  { key: "vehicle_key", label: "鍵" },
  { key: "abnormal_point", label: "異常箇所" },
];

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-mist-500 mb-1">{label}</p>
      <p className="w-full min-h-12 rounded-lg bg-mist-100/50 px-4 py-3 text-mist-700 whitespace-pre-wrap break-words">
        {value}
      </p>
    </div>
  );
}

function formatTime(value: string | null) {
  if (!value) return "-";
  return value.slice(0, 5);
}

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = Number(params.id);
  const [report, setReport] = useState<Report | null>(null);
  const [projectName, setProjectName] = useState("");
  const [vehicleCheck, setVehicleCheck] = useState<VehicleCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!Number.isFinite(reportId) || reportId <= 0) {
      setErrorMessage("日報を特定できませんでした。");
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (error || !data) {
        console.error(error);
        setErrorMessage("日報を読み込めませんでした。");
        setLoading(false);
        return;
      }

      setReport(data as Report);

      // 車両点検は daily_reports ではなく driver_vehicle_checks から取得
      const { data: checkData, error: checkError } = await supabase
        .from("driver_vehicle_checks")
        .select("*")
        .eq("driver_id", data.driver_id)
        .eq("check_date", data.report_date)
        .maybeSingle();

      if (checkError) {
        console.error("車両点検の読み込みに失敗しました", checkError);
      }
      setVehicleCheck((checkData as VehicleCheck | null) ?? null);

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("name")
        .eq("id", data.project_id)
        .single();

      if (projectError) console.error(projectError);
      setProjectName(project?.name ?? "不明");
      setLoading(false);
    };

    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <main className="p-4 pt-24">
        <p>読み込み中...</p>
      </main>
    );
  }

  if (errorMessage || !report) {
    return (
      <main className="p-4 pt-24 space-y-4">
        <p className="text-sm text-red-600">
          {errorMessage || "日報が見つかりません。"}
        </p>
        <Link
          href="/test/report/history"
          className="text-sm text-teal-700 underline"
        >
          履歴に戻る
        </Link>
      </main>
    );
  }

  const mileage = (report.odometer_end ?? 0) - (report.odometer_start ?? 0);
  const isShein = projectName === "SHEIN";
  const isCSOSakaTech = projectName === "CS大阪テック";

  const vehicleCheckStatus = isShein
    ? "対象外"
    : vehicleCheck
      ? "入力済み"
      : "未入力";

  const vehiclePhotos = vehicleCheck?.vehicle_photos ?? {};

  return (
    <main className="px-4 pt-24 pb-40">
      <div className="max-w-md mx-auto space-y-4">
        <header className="rounded-lg border border-mist-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 rounded-t-lg bg-mist-100 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
              <ClipboardPen size={24} />
            </div>
            <div className="min-w-0">
              <PageTitle>日報詳細</PageTitle>

              <p className="mt-0.5 text-xs leading-5 text-mist-500">
                保存済みの日報を日付ごとに確認できます。
              </p>
            </div>
          </div>

          <div className="w-full min-w-0 max-w-full p-4">
            <div className="space-y-4">
              <div className="flex gap-2 items-baseline">
                <p className="text-xs text-mist-600">対象日</p>
                <p className="text-xl font-bold text-mist-800">
                  {report.report_date}
                </p>
              </div>
              <div>
                <p className="text-sm text-mist-500">
                  {projectName} ／ {report.plate_number ?? "車両未登録"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-teal-50 px-3 py-2 flex justify-between items-baseline">
                  <p className="text-xs text-mist-600">車両点検</p>
                  <p
                    className={`text-sm font-bold ${
                      vehicleCheckStatus === "入力済み"
                        ? "text-teal-700"
                        : "text-mist-500"
                    }`}
                  >
                    {vehicleCheckStatus === "入力済み" && (
                      <CircleCheckBig size={16} className="inline mr-1" />
                    )}
                    {vehicleCheckStatus}
                  </p>
                </div>
                <div className="rounded-lg bg-sky-50 px-3 py-2 flex justify-between items-baseline">
                  <p className="text-xs text-mist-500">日報</p>
                  <p className="text-sm font-bold text-sky-700">
                    <CircleCheckBig size={16} className="inline mr-1" />
                    入力済み
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* 車両点検 */}
        {!isShein && (
          <Card>
            <details>
              <summary className="list-none cursor-pointer flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-mist-700">
                  <ClipboardCheck size={22} className="text-teal-600" />
                  車両点検
                </span>
                <ChevronDown size={20} className="text-teal-600" />
              </summary>

              <div className="border-t border-mist-200 mt-4 pt-4 space-y-5">
                {!vehicleCheck ? (
                  <p className="rounded-lg bg-mist-50 p-4 text-sm text-mist-500">
                    この日付の車両点検データは登録されていません。
                  </p>
                ) : (
                  <>
                    <section className="space-y-3">
                      <FormSection
                        icon={<ClipboardPen size={22} />}
                        title="アルコールチェック"
                      />
                      <DetailField
                        label="チェック時間"
                        value={formatTime(vehicleCheck.alcohol_check_time)}
                      />
                      {vehicleCheck.alcohol_check_image_url ? (
                        <a
                          href={vehicleCheck.alcohol_check_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={vehicleCheck.alcohol_check_image_url}
                            alt="アルコールチェック写真"
                            className="w-full max-w-xs rounded-xl border border-mist-200 object-cover"
                          />
                          <span className="mt-1 inline-block text-sm text-teal-700 underline">
                            写真を拡大して見る
                          </span>
                        </a>
                      ) : (
                        <p className="text-sm text-mist-500">写真なし</p>
                      )}
                    </section>

                    <section className="space-y-3">
                      <FormSection
                        icon={<ClipboardPen size={22} />}
                        title="体温チェック"
                      />
                      <DetailField
                        label="体温"
                        value={
                          vehicleCheck.temperature_check_value == null
                            ? "未入力"
                            : `${vehicleCheck.temperature_check_value}℃`
                        }
                      />
                      {vehicleCheck.temperature_check_image_url ? (
                        <a
                          href={vehicleCheck.temperature_check_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={vehicleCheck.temperature_check_image_url}
                            alt="体温チェック写真"
                            className="w-full max-w-xs rounded-xl border border-mist-200 object-cover"
                          />
                          <span className="mt-1 inline-block text-sm text-teal-700 underline">
                            写真を拡大して見る
                          </span>
                        </a>
                      ) : (
                        <p className="text-sm text-mist-500">写真なし</p>
                      )}
                    </section>

                    <section className="space-y-3">
                      <FormSection
                        icon={<CircleCheckBig size={22} />}
                        title="運行前点検"
                      />
                      <div className="space-y-2">
                        {vehicleCheckItems.map(({ key, label }) => {
                          const value = vehicleCheck[key];
                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between gap-3 rounded-lg bg-mist-50 px-3 py-2 text-sm"
                            >
                              <span className="text-mist-700">{label}</span>
                              <span
                                className={`shrink-0 font-semibold ${value === true ? "text-teal-700" : "text-red-600"}`}
                              >
                                {value === true ? (
                                  <CheckCircle2 size={20} />
                                ) : value === false ? (
                                  <CircleX size={20} />
                                ) : (
                                  "未入力"
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <FormSection icon={<Van size={22} />} title="車両写真" />
                      <div className="grid grid-cols-2 gap-3">
                        {vehiclePhotoItems.map(({ key, label }) => {
                          const url = vehiclePhotos[key];
                          return (
                            <div key={key} className="space-y-1">
                              <p className="text-xs font-medium text-mist-600">
                                {label}
                              </p>
                              {url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={url}
                                    alt={label}
                                    className="aspect-square w-full rounded-lg border border-mist-200 object-cover"
                                  />
                                </a>
                              ) : (
                                <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-mist-200 bg-mist-50 text-xs text-mist-400">
                                  写真なし
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </details>
          </Card>
        )}
        {/* 日報 */}
        <Card>
          <details>
            <summary className="list-none cursor-pointer flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-mist-700">
                <ClipboardPen size={22} className="text-teal-600" />
                日報
              </span>
              <ChevronDown size={20} className="text-teal-600" />
            </summary>

            <div className="border-t border-mist-200 mt-4 pt-4 space-y-5">
              <section className="space-y-3">
                <FormSection
                  icon={<ClipboardPen size={22} />}
                  title="勤務情報"
                />
                <DetailField label="出勤区分" value={report.work_status} />
                {report.work_status === "欠勤" && (
                  <DetailField
                    label="欠勤理由"
                    value={report.absence_reason ?? "-"}
                  />
                )}
              </section>

              {report.work_status !== "欠勤" && !isShein && (
                <>
                  <section className="space-y-3">
                    <FormSection icon={<Van size={22} />} title="走行情報" />
                    <DetailField
                      label="配送エリア"
                      value={report.delivery_area ?? "-"}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField
                        label="出発場所"
                        value={report.start_location ?? "-"}
                      />
                      <DetailField
                        label="帰着場所（案件設定）"
                        value={report.end_location ?? "-"}
                      />
                    </div>

                    <DetailField
                      label="主な経過地点"
                      value={report.main_transit_points ?? "未入力"}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField
                        label="出庫メーター"
                        value={`${report.odometer_start ?? 0}km`}
                      />
                      <DetailField
                        label="帰庫メーター"
                        value={`${report.odometer_end ?? 0}km`}
                      />
                    </div>
                    <div className="bg-mist-100 rounded-lg p-3 flex justify-between">
                      <span className="text-sm text-mist-500">走行距離</span>
                      <span className="font-bold text-mist-700">
                        {mileage.toLocaleString()} km
                      </span>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <FormSection icon={<Clock size={22} />} title="勤務時間" />
                    <DetailField
                      label="業務開始時間"
                      value={formatTime(report.start_time)}
                    />
                    <div className="grid grid-cols-2 gap-3">
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
                    <DetailField
                      label="休憩・睡眠の地点と日時"
                      value={report.break_sleep_records ?? "未入力"}
                    />
                    <DetailField
                      label="業務交替の地点・日時"
                      value={report.driver_change_records ?? "該当なし／未入力"}
                    />
                  </section>

                  <section className="space-y-3">
                    <FormSection
                      icon={<Clock size={22} />}
                      title="待機・荷役・附帯業務"
                    />
                    <DetailField
                      label="荷主都合による30分以上の待機"
                      value={report.waiting_records ?? "該当なし／未入力"}
                    />
                    <DetailField
                      label="荷役作業・附帯業務"
                      value={
                        report.cargo_handling_records ?? "該当なし／未入力"
                      }
                    />
                    <DetailField
                      label="事故・異常・著しい遅延など"
                      value={report.incident_records ?? "該当なし／未入力"}
                    />
                  </section>
                </>
              )}

              {report.work_status !== "欠勤" && (
                <section className="space-y-3">
                  <FormSection icon={<Package size={22} />} title="配送実績" />
                  <DetailField
                    label="配達完了件数"
                    value={`${report.delivery_count ?? 0}件`}
                  />
                  {!isShein && (
                    <>
                      {!isCSOSakaTech && (
                        <DetailField
                          label="不在持ち帰り件数"
                          value={`${report.returned_delivery_count ?? 0}件`}
                        />
                      )}
                      <DetailField
                        label="伝票枚数"
                        value={`${report.carry_out_am ?? 0}枚`}
                      />
                    </>
                  )}
                </section>
              )}

              <section>
                <DetailField label="備考" value={report.note ?? "-"} />
              </section>
            </div>
          </details>
        </Card>
        <Link
          href="/test/report/history"
          className="text-sm font-medium text-mist-500"
        >
          ← 履歴に戻る
        </Link>
      </div>

      {/* 下部固定アクション */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-mist-200 max-w-md mx-auto  bg-teal-50 px-4 py-3 backdrop-blur">
        <div className="max-w-md mx-auto space-y-2">
          <div
            className={`grid ${isShein ? "grid-cols-1" : "grid-cols-2"} gap-2`}
          >
            {!isShein && (
              <Link
                href={`/test/report/check?date=${report.report_date}&id=${report.id}`}
                className="w-full"
              >
                <Button className="w-full">点検を編集</Button>
              </Link>
            )}
            <Link
              href={`/test/report/new?date=${report.report_date}&id=${report.id}`}
              className="w-full"
            >
              <Button className="w-full">日報を編集</Button>
            </Link>
          </div>

          <Link
            href={`/test/report/pdf?date=${report.report_date}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-teal-700 bg-white px-4 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50"
          >
            <FileText size={18} />
            PDFプレビュー
          </Link>
        </div>
      </div>
    </main>
  );
}
