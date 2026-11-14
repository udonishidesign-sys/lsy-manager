"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  ClipboardPen,
  Package,
  Van,
  Clock,
  FileText,
  ClipboardCheck,
  Thermometer,
  Camera,
  CheckCircle2,
  CircleX,
  ZoomIn,
  X,
} from "lucide-react";

type Report = Record<string, any>;
type Driver = {
  name?: string | null;
  plate_number?: string | null;
};
type Project = {
  name?: string | null;
  requires_vehicle_check?: boolean | null;
};
type VehicleCheck = Record<string, any>;

const checkItems = [
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

const photoItems = [
  { key: "vehicle_front", label: "車両前面" },
  { key: "vehicle_rear", label: "車両後面" },
  { key: "vehicle_key", label: "鍵" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP");
}

function displayValue(value: unknown, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${suffix}`;
}

function formatNumber(value: unknown, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return `${value}${suffix}`;
  return `${number.toLocaleString("ja-JP")}${suffix}`;
}

function formatYen(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${number.toLocaleString("ja-JP")}円`;
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="text-teal-700">{icon}</span>
        <h2 className="font-bold text-slate-800">{title}</h2>
      </div>
      <div className="space-y-0 px-4 ">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[minmax(130px,0.8fr)_1.5fr] sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd
        className={`min-w-0 text-sm font-medium text-slate-800 ${
          multiline
            ? "whitespace-pre-wrap break-words leading-6"
            : "break-words"
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function StatusValue({ value }: { value: unknown }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-green-700">
        <CheckCircle2 size={16} />
        異常なし
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
        <CircleX size={16} />
        異常あり
      </span>
    );
  }

  return <span className="text-slate-400">未入力</span>;
}

export default function AdminReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = Number(params.id);

  const [report, setReport] = useState<Report | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [vehicleCheck, setVehicleCheck] = useState<VehicleCheck | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(reportId) || reportId <= 0) {
      setError("日報IDが正しくありません。");
      setLoading(false);
      return;
    }

    const loadReport = async () => {
      setLoading(true);
      setError("");

      const { data: reportData, error: reportError } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", reportId)
        .is("deleted_at", null)
        .maybeSingle();

      if (reportError || !reportData) {
        setError(
          reportError
            ? `日報の取得に失敗しました：${reportError.message}`
            : "日報が見つかりませんでした。",
        );
        setLoading(false);
        return;
      }

      setReport(reportData);

      const [
        { data: driverData, error: driverError },
        { data: projectData, error: projectError },
      ] = await Promise.all([
        supabase
          .from("drivers")
          .select("*")
          .eq("id", reportData.driver_id)
          .maybeSingle(),
        supabase
          .from("projects")
          .select("id, name, requires_vehicle_check")
          .eq("id", reportData.project_id)
          .maybeSingle(),
      ]);

      if (driverError) {
        console.error("ドライバー情報の取得に失敗しました", driverError);
      }

      if (projectError) {
        console.error("案件情報の取得に失敗しました", projectError);
      }

      setDriver(driverData ?? null);
      setProject(projectData ?? null);

      // 車両点検が必要な案件だけ、別テーブルから点検情報を取得
      if (projectData?.requires_vehicle_check) {
        const { data: checkData, error: checkError } = await supabase
          .from("driver_vehicle_checks")
          .select("*")
          .eq("driver_id", reportData.driver_id)
          .eq("check_date", reportData.report_date)
          .maybeSingle();

        if (checkError) {
          console.error("車両点検情報の取得に失敗しました", checkError);
        }

        setVehicleCheck(checkData ?? null);
      } else {
        setVehicleCheck(null);
      }

      setLoading(false);
    };

    void loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-4 pt-8">
        <p className="text-sm text-slate-500">日報を読み込んでいます...</p>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 p-4 pt-8">
        <button
          type="button"
          onClick={() => router.push("/reports")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={18} />
          日報一覧に戻る
        </button>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error || "日報を表示できませんでした。"}
        </div>
      </main>
    );
  }

  const projectName = project?.name ?? "過去の案件";
  const isShein = projectName === "SHEIN";
  const isCSOSakaTech = projectName === "CS大阪テック";
  const requiresVehicleCheck = Boolean(project?.requires_vehicle_check);
  const isAbsent = report.work_status === "欠勤";
  const submittedAt = report.submitted_at as string | null;
  const plateNumber = report.plate_number || driver?.plate_number || "未登録";
  const distance =
    report.odometer_start !== null &&
    report.odometer_start !== undefined &&
    report.odometer_end !== null &&
    report.odometer_end !== undefined
      ? Math.max(Number(report.odometer_end) - Number(report.odometer_start), 0)
      : null;

  const transitPoints = String(report.main_transit_points ?? "")
    .split(/[、,，\n]/)
    .map((value) => value.trim())
    .filter(Boolean);

  const vehiclePhotos =
    (vehicleCheck?.vehicle_photos as Record<string, string> | null) ?? {};

  const imageItems = [
    {
      label: "アルコールチェック写真",
      url: vehicleCheck?.alcohol_check_image_url,
    },
    {
      label: "体温チェック写真",
      url: vehicleCheck?.temperature_check_image_url,
    },
    ...photoItems.map((item) => ({
      label: item.label,
      url: vehiclePhotos[item.key],
    })),
  ].filter((item) => Boolean(item.url));

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-5 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/reports")}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            日報一覧に戻る
          </button>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              submittedAt
                ? "bg-teal-100 text-teal-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {submittedAt ? "提出済み" : "未提出"}
          </span>
        </div>

        {/* 基本情報 */}
        <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <CalendarDays size={16} />
                {formatDate(report.report_date)}
              </p>
              <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                運行日報
              </h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                <UserRound size={16} />
                {driver?.name ?? "ドライバー情報なし"}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs text-slate-500">案件</p>
              <p className="mt-1 font-bold text-slate-800">{projectName}</p>
              <p className="mt-2 text-xs text-slate-500">車両ナンバー</p>
              <p className="mt-1 font-bold text-slate-800">{plateNumber}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-slate-500">日報提出日時：</span>
              <span className="font-medium text-slate-800">
                {submittedAt ? formatDateTime(submittedAt) : "未提出"}
              </span>
            </div>

            {requiresVehicleCheck && (
              <div>
                <span className="text-slate-500">点検提出日時：</span>
                <span className="font-medium text-slate-800">
                  {vehicleCheck?.submitted_at
                    ? formatDateTime(vehicleCheck.submitted_at)
                    : "未提出"}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* 出勤区分 */}
        <Section title="出勤区分" icon={<ClipboardPen size={20} />}>
          <InfoRow label="出勤区分" value={displayValue(report.work_status)} />
          {isAbsent && (
            <InfoRow
              label="欠勤理由"
              value={displayValue(report.absence_reason)}
            />
          )}
        </Section>

        {/* 出勤時のみ表示 */}
        {!isAbsent && !isShein && (
          <>
            <Section title="走行情報" icon={<Van size={20} />}>
              <InfoRow
                label="配送エリア"
                value={displayValue(report.delivery_area)}
              />
              <InfoRow
                label="出発場所"
                value={displayValue(report.start_location)}
              />
              <InfoRow
                label="帰着場所"
                value={displayValue(report.end_location)}
              />
              <InfoRow
                label="出庫メーター"
                value={formatNumber(report.odometer_start, " km")}
              />
              <InfoRow
                label="帰庫メーター"
                value={formatNumber(report.odometer_end, " km")}
              />
              <InfoRow
                label="走行距離"
                value={distance === null ? "—" : formatNumber(distance, " km")}
              />
            </Section>

            <Section title="勤務時間" icon={<Clock size={20} />}>
              <InfoRow
                label="業務開始時間"
                value={displayValue(report.start_time)}
              />
              <InfoRow
                label="休憩開始"
                value={displayValue(report.break_start)}
              />
              <InfoRow
                label="休憩終了"
                value={displayValue(report.break_end)}
              />
              <InfoRow
                label="業務終了時刻"
                value={displayValue(report.end_time)}
              />
            </Section>

            <Section title="法定運行記録" icon={<Clock size={20} />}>
              <InfoRow
                label="主な経過地点"
                multiline
                value={
                  transitPoints.length > 0 ? (
                    <ol className="list-inside list-decimal space-y-1">
                      {transitPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ol>
                  ) : (
                    "—"
                  )
                }
              />
              <InfoRow
                label="休憩・睡眠の地点と記録"
                multiline
                value={displayValue(report.break_sleep_records)}
              />
            </Section>

            <Section
              title="待機・荷役・附帯業務の記録"
              icon={<FileText size={20} />}
            >
              <InfoRow
                label="荷主都合による30分以上の待機"
                multiline
                value={displayValue(report.waiting_records)}
              />
              <InfoRow
                label="荷役作業・附帯業務"
                multiline
                value={displayValue(report.cargo_handling_records)}
              />
              <InfoRow
                label="事故・異常・著しい遅延など"
                multiline
                value={displayValue(report.incident_records)}
              />
            </Section>
          </>
        )}

        {/* 配送実績 */}
        {!isAbsent && (
          <Section title="配送実績" icon={<Package size={20} />}>
            <InfoRow
              label="配達完了件数"
              value={formatNumber(report.delivery_count, " 件")}
            />

            {!isShein && !isCSOSakaTech && (
              <InfoRow
                label="不在持ち帰り件数"
                value={formatNumber(report.returned_delivery_count, " 件")}
              />
            )}

            {!isShein && (
              <InfoRow
                label="伝票枚数"
                value={formatNumber(report.carry_out_am, " 枚")}
              />
            )}
          </Section>
        )}

        {/* 備考：SHEIN以外 */}
        {!isShein && (
          <Section title="備考" icon={<FileText size={20} />}>
            <div className="py-3">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                {report.note || "記載なし"}
              </p>
            </div>
          </Section>
        )}

        {/* Amazonなど、車両点検が必要な案件のみ */}
        {requiresVehicleCheck && (
          <>
            <Section
              title="アルコールチェック"
              icon={<ClipboardCheck size={20} />}
            >
              {!vehicleCheck ? (
                <p className="py-4 text-sm text-slate-500">
                  車両点検データがまだ保存されていません。
                </p>
              ) : (
                <>
                  <InfoRow
                    label="チェック時間"
                    value={displayValue(vehicleCheck.alcohol_check_time)}
                  />
                  <InfoRow
                    label="写真"
                    value={
                      vehicleCheck.alcohol_check_image_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setEnlargedPhoto(
                              vehicleCheck.alcohol_check_image_url,
                            )
                          }
                          className="inline-flex items-center gap-2 text-teal-700 underline"
                        >
                          <ZoomIn size={16} />
                          写真を確認
                        </button>
                      ) : (
                        "写真なし"
                      )
                    }
                  />
                </>
              )}
            </Section>

            <Section title="体温チェック" icon={<Thermometer size={20} />}>
              {!vehicleCheck ? (
                <p className="py-4 text-sm text-slate-500">
                  体温チェックデータがありません。
                </p>
              ) : (
                <>
                  <InfoRow
                    label="体温"
                    value={formatNumber(
                      vehicleCheck.temperature_check_value,
                      " ℃",
                    )}
                  />
                  <InfoRow
                    label="写真"
                    value={
                      vehicleCheck.temperature_check_image_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setEnlargedPhoto(
                              vehicleCheck.temperature_check_image_url,
                            )
                          }
                          className="inline-flex items-center gap-2 text-teal-700 underline"
                        >
                          <ZoomIn size={16} />
                          写真を確認
                        </button>
                      ) : (
                        "写真なし"
                      )
                    }
                  />
                </>
              )}
            </Section>

            <Section title="車両点検" icon={<CheckCircle2 size={20} />}>
              {!vehicleCheck ? (
                <p className="py-4 text-sm text-slate-500">
                  車両点検データがありません。
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {checkItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <span className="min-w-0 flex-1 text-sm text-slate-700">
                        {item.label}
                      </span>
                      <span className="shrink-0 text-sm">
                        <StatusValue value={vehicleCheck[item.key]} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="車両写真" icon={<Camera size={20} />}>
              {!vehicleCheck ? (
                <p className="py-4 text-sm text-slate-500">
                  車両写真データがありません。
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-3">
                  {photoItems.map((item) => {
                    const url = vehiclePhotos[item.key];

                    return (
                      <div key={item.key} className="min-w-0">
                        <p className="mb-2 text-sm font-semibold text-slate-600">
                          {item.label}
                        </p>
                        {url ? (
                          <button
                            type="button"
                            onClick={() => setEnlargedPhoto(url)}
                            className="group relative block aspect-square w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                          >
                            <img
                              src={url}
                              alt={item.label}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                              <ZoomIn size={26} />
                            </span>
                          </button>
                        ) : (
                          <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                            写真なし
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </>
        )}

        <div className="flex justify-center pb-8">
          <button
            type="button"
            onClick={() => router.push("/reports")}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            <ArrowLeft size={18} />
            日報一覧に戻る
          </button>
        </div>
      </div>

      {/* 写真拡大 */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setEnlargedPhoto(null)}
        >
          <button
            type="button"
            aria-label="閉じる"
            className="absolute right-4 top-4 rounded-full bg-white p-2 text-slate-700"
            onClick={() => setEnlargedPhoto(null)}
          >
            <X size={22} />
          </button>

          <img
            src={enlargedPhoto}
            alt="写真の拡大表示"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
