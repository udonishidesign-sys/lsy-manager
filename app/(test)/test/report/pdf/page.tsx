"use client";
import {
  createElement,
  Fragment,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getDriverSessionId } from "@/lib/driver-session";
import Card from "@/components/ui/Card";
import AuthGuard from "@/components/AuthGuard";
import PageTitle from "@/components/ui/PageTitle";
import { ArrowLeft, CheckCircle2, CircleX, FileText } from "lucide-react";

type Row = Record<string, any>;

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function show(value: unknown, suffix = "") {
  if (value === null || value === undefined || value === "") return "未入力";
  if (typeof value === "boolean") return value ? "確認済み" : "未確認";
  return `${String(value)}${suffix}`;
}
function time(value: unknown) {
  if (!value) return "未入力";
  return String(value).slice(0, 5);
}
function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}
function parseRecords(value: unknown): string[] {
  if (value === null || value === undefined || value === "") return [];
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [value];
    }
  }
  if (Array.isArray(parsed)) {
    return parsed.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return Object.entries(item as Record<string, unknown>)
          .map(([key, val]) => `${key}: ${val ?? "未入力"}`)
          .join(" / ");
      }
      return String(item);
    });
  }
  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed as Record<string, unknown>).map(
      ([key, val]) => `${key}: ${val ?? "未入力"}`,
    );
  }
  return [String(parsed)];
}

const inspectionItems = [
  ["check_brake", "ブレーキ"],
  ["check_tire", "タイヤ"],
  ["check_handle", "ハンドル"],
  ["check_mirror", "ミラー"],
  ["check_wiper", "ワイパー"],
  ["check_headlight", "前照灯"],
  ["check_turn_signal", "ウインカー"],
  ["check_hazard", "ハザード"],
  ["check_horn", "ホーン"],
  ["check_drive_recorder", "ドライブレコーダー"],
  ["check_oil", "エンジンオイル"],
  ["check_coolant", "冷却水"],
  ["check_battery", "バッテリー"],
  ["check_fuel", "燃料"],
  ["check_engine", "原動機"],
  ["check_light", "灯火装置"],
  ["check_emergency_signal", "非常用信号"],
  ["check_license_plate", "登録番号表"],
  ["check_vehicle_inspection", "車検証"],
  ["check_insurance", "保険証"],
  ["check_cargo_area", "荷室"],
  ["check_load_condition", "積載状態"],
];

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 border-b border-mist-200">
      <dt className="text-xs text-mist-500">{label}</dt>
      <dd className="mt-1 break-words text-base font-medium text-mist-800">
        {show(value)}
      </dd>
    </div>
  );
}

export default function ReportPdfPreviewPage() {
  const router = useRouter();
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [date, setDate] = useState("");
  const [driverId, setDriverId] = useState<number | null>(null);
  const [driverName, setDriverName] = useState("");
  const [report, setReport] = useState<Row | null>(null);
  const [check, setCheck] = useState<Row | null>(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const availableWidth = window.innerWidth - 24;
      setPreviewScale(Math.min(1, availableWidth / 794));
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedDate = params.get("date");

    if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      setDate(requestedDate);
    } else {
      setDate(localDate());
    }
    const id = getDriverSessionId();
    if (!id) {
      router.replace("/login");
      return;
    }
    setDriverId(id);
  }, [router]);

  const load = useCallback(async () => {
    if (!driverId || !date) return;
    setLoading(true);
    setError("");
    setReport(null);
    setCheck(null);
    setProjectName("");
    const [driverResult, reportResult, checkResult] = await Promise.all([
      supabase.from("drivers").select("name").eq("id", driverId).maybeSingle(),
      supabase
        .from("daily_reports")
        .select("*")
        .eq("driver_id", driverId)
        .eq("report_date", date)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("driver_vehicle_checks")
        .select("*")
        .eq("driver_id", driverId)
        .eq("check_date", date)
        .maybeSingle(),
    ]);
    if (reportResult.error)
      setError(`日報の読み込みに失敗しました：${reportResult.error.message}`);
    else if (checkResult.error)
      setError(
        `点検記録の読み込みに失敗しました：${checkResult.error.message}`,
      );
    setDriverName(driverResult.data?.name ?? "");
    const reportData = reportResult.data as Row | null;
    setReport(reportData);
    setCheck((checkResult.data as Row | null) ?? null);
    if (reportData?.project_id) {
      const { data } = await supabase
        .from("projects")
        .select("name")
        .eq("id", reportData.project_id)
        .maybeSingle();
      setProjectName(data?.name ?? "");
    } else {
      setProjectName("");
    }
    setLoading(false);
  }, [driverId, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const mileage =
    report && report.odometer_start != null && report.odometer_end != null
      ? Math.max(Number(report.odometer_end) - Number(report.odometer_start), 0)
      : null;
  const photoLabel: Record<string, string> = {
    tire_front_left: "タイヤ左前",
    tire_front_right: "タイヤ右前",
    tire_rear_left: "タイヤ左後",
    tire_rear_right: "タイヤ右後",
    vehicle_front: "車両前面",
    vehicle_rear: "車両後面",
    vehicle_left: "車両左側面",
    vehicle_right: "車両右側面",
    cargo_area: "荷室",
    vehicle_key: "鍵",
    abnormal_point: "異常箇所",
  };
  const photoEntries: Array<[string, string | null | undefined]> = [
    ...Object.entries(photoLabel).map(
      ([key, label]) =>
        [
          label,
          (check?.vehicle_photos as Record<string, string> | undefined)?.[key],
        ] as [string, string | null | undefined],
    ),
  ];
  const complianceRecords: [string, unknown][] = [
    ["主な経過地点", report?.main_transit_points],
    ["休憩の地点", report?.break_sleep_records],
    ["待機記録", report?.waiting_records],
    ["荷役・附帯業務", report?.cargo_handling_records],
    ["事故・異常等", report?.incident_records],
  ];

  const downloadPdf = async () => {
    if (!report) {
      setError("日報データがないため、PDFを作成できません。");
      return;
    }

    try {
      setPdfGenerating(true);
      setError("");

      const [{ pdf }, { default: ReportPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ReportPdfDocument"),
      ]);

      const pdfElement = createElement(ReportPdfDocument, {
        date,
        driverName,
        projectName,
        report,
        check,
        mileage,
        photoEntries,
        complianceRecords,
      });

      const blob = await pdf(pdfElement as any).toBlob();

      const safeDriverName =
        driverName.replace(/[\\/:*?"<>|]/g, "_").trim() || "ドライバー";

      const fileName = `運行日報_${date}_${safeDriverName}.pdf`;

      const file = new File([blob], fileName, {
        type: "application/pdf",
      });

      // スマホ：共有メニューから保存
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
        });
        return;
      }

      // 共有機能が使えない場合：通常のダウンロード
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");

      link.href = url;
      link.download = fileName;

      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        return;
      }

      console.error("PDF生成エラー:", e);

      setError(
        "PDFの作成に失敗しました。フォントや写真の読み込みを確認してください。",
      );
    } finally {
      setPdfGenerating(false);
    }
  };

  function PreviewSection({ title }: { title: string }) {
    return (
      <div className="bg-mist-600 px-3 py-2 text-sm font-bold text-white">
        {title}
      </div>
    );
  }

  function PreviewCell({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) {
    return (
      <>
        <div className="border-b border-r border-mist-400 bg-mist-100 px-2 py-2 text-xs font-semibold text-mist-700 flex h-full items-center">
          {label}
        </div>
        <div className="min-w-0 border-b border-r border-mist-400 px-2 py-2 text-sm text-mist-800 break-words whitespace-pre-wrap">
          {value ?? "未入力"}
        </div>
      </>
    );
  }

  function PreviewRow({ children }: { children: React.ReactNode }) {
    return (
      <div className="grid grid-cols-[22%_28%_22%_28%] border-l border-mist-400 items-stretch">
        {children}
      </div>
    );
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-mist-100 px-3 pb-24 pt-24 sm:px-5">
        <div className="no-print mx-auto mb-4 max-w-md space-y-3">
          <header className="rounded-lg border border-mist-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 rounded-t-lg bg-mist-100 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
                <FileText size={24} />
              </div>
              <div className="min-w-0">
                <PageTitle>日報・点検 PDFプレビュー</PageTitle>
                <p className="mt-0.5 text-xs leading-5 text-mist-500">
                  帳票形式で確認できます。
                </p>
              </div>
            </div>
            <div className="w-full min-w-0 max-w-full p-4 space-y-3">
              <label
                htmlFor="report-date"
                className="mb-2 block text-sm font-semibold text-mist-700"
              >
                帳票の日付
              </label>

              <input
                id="report-date"
                type="date"
                value={date}
                max={localDate()}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full mx-auto max-w-full box-border appearance-none rounded-lg border border-mist-300 bg-white px-3 py-3 text-base text-mist-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadPdf}
                  disabled={loading || pdfGenerating || !report}
                  className="inline-flex basis-1/2 justify-center items-center gap-2 rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm"
                >
                  <FileText size={16} />
                  {pdfGenerating ? "PDF作成中…" : "PDFダウンロード"}
                </button>
              </div>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>
          </header>
        </div>

        {loading ? (
          <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center text-sm text-mist-500">
            帳票を読み込み中…
          </div>
        ) : (
          <div
            className="mx-auto flex flex-col items-center gap-6"
            style={{ width: `${794 * previewScale}px` }}
          >
            {/* 1ページ目：運行日報・法定記録 */}
            <article
              className="pdf-sheet relative mx-auto bg-white px-10 py-10 shadow-lg"
              style={{
                width: "794px",
                height: "1123px",
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
                marginBottom: `${1123 * (previewScale - 1)}px`,
              }}
            >
              <header>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="mt-2 text-xs font-bold text-mist-600">
                      DRIVER DAILY REPORT
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-mist-900">
                      運行日報
                    </h2>
                  </div>
                  <div className="text-right text-sm text-mist-600">
                    <p className="mt-2 text-sm text-mist-600">
                      {formatDate(date)}
                    </p>
                  </div>
                </div>
              </header>

              <section className="mt-4">
                <PreviewSection title="ドライバー情報" />

                {projectName === "SHEIN" ? (
                  <PreviewRow>
                    <PreviewCell label="氏名" value={show(driverName)} />
                    <PreviewCell
                      label="車両番号"
                      value={show(report?.plate_number)}
                    />
                    <div className="mt-4">
                      <PreviewSection title="運行記録" />
                      <PreviewRow>
                        <PreviewCell label="案件名" value={show(projectName)} />
                        <PreviewCell
                          label="配達完了件数"
                          value={show(report?.deliveryCount)}
                        />
                      </PreviewRow>
                    </div>
                  </PreviewRow>
                ) : (
                  <>
                    <PreviewRow>
                      <PreviewCell label="氏名" value={show(driverName)} />
                      <PreviewCell
                        label="車両番号"
                        value={show(report?.plate_number)}
                      />
                    </PreviewRow>

                    <div className="mt-4">
                      <PreviewSection title="運行記録" />
                      <PreviewRow>
                        <PreviewCell label="案件名" value={show(projectName)} />
                        <PreviewCell
                          label="配送エリア"
                          value={show(report?.delivery_area)}
                        />
                      </PreviewRow>

                      <PreviewRow>
                        <PreviewCell
                          label="業務開始時間"
                          value={
                            report?.start_time
                              ? `${time(report.start_time)}`
                              : "未入力"
                          }
                        />
                        <PreviewCell
                          label="業務終了時間"
                          value={
                            report?.end_time
                              ? `${time(report.end_time)}`
                              : "未入力"
                          }
                        />
                      </PreviewRow>

                      <PreviewRow>
                        <PreviewCell
                          label="休憩開始時刻"
                          value={time(report?.break_start)}
                        />
                        <PreviewCell
                          label="休憩終了時刻"
                          value={time(report?.break_end)}
                        />
                      </PreviewRow>

                      <PreviewRow>
                        <PreviewCell
                          label="出発場所"
                          value={show(report?.start_location)}
                        />
                        <PreviewCell
                          label="帰着場所"
                          value={show(report?.end_location)}
                        />
                      </PreviewRow>
                    </div>
                    <div className="mt-4">
                      <PreviewSection title="走行記録" />
                      <PreviewRow>
                        <PreviewCell
                          label="出庫メーター"
                          value={
                            report?.odometer_start == null
                              ? "未入力"
                              : `${report.odometer_start} km`
                          }
                        />
                        <PreviewCell
                          label="帰庫メーター"
                          value={
                            report?.odometer_end == null
                              ? "未入力"
                              : `${report.odometer_end} km`
                          }
                        />
                      </PreviewRow>
                      <PreviewRow>
                        <PreviewCell
                          label="走行距離"
                          value={mileage === null ? "未入力" : `${mileage} km`}
                        />
                      </PreviewRow>
                    </div>

                    {report?.work_status === "欠勤" && (
                      <div className="mt-4">
                        <PreviewSection title="欠勤記録" />
                        <div className="grid grid-cols-[22%_78%] border-l border-t border-mist-400">
                          <div className="border-b border-r border-mist-400 bg-mist-100 px-2 py-2 text-xs font-semibold">
                            欠勤理由
                          </div>
                          <div className="border-b border-r border-mist-400 px-2 py-2 text-xs">
                            {show(report.absence_reason)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <PreviewSection title="法定記録・追加記録" />
                      <div className="grid grid-cols-[30%_70%] border-l border-t border-mist-400">
                        {complianceRecords.map(([label, value]) => {
                          const parsed = parseRecords(value);
                          return (
                            <Fragment key={label}>
                              <div className="border-b border-r border-mist-400 bg-mist-100 px-2 py-2 text-xs font-semibold text-mist-700">
                                {label}
                              </div>
                              <div className="border-b border-r border-mist-400 px-2 py-2 text-sm text-mist-800">
                                {parsed.length
                                  ? parsed.map((record, index) => (
                                      <div key={index}>{record}</div>
                                    ))
                                  : "未入力"}
                              </div>
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4">
                      <PreviewSection title="備考" />
                      <div className="min-h-14 border border-mist-400 px-3 py-3 text-sm text-mist-700 whitespace-pre-wrap">
                        {show(report?.note)}
                      </div>
                    </div>
                  </>
                )}
              </section>

              <footer className="absolute bottom-8 left-10 right-10 border-t border-mist-300 pt-3 text-[10px] text-mist-500">
                本帳票はアプリに保存された記録を出力したものです。
              </footer>
            </article>

            {/* 2ページ目：点検・写真 */}
            {projectName !== "SHEIN" && (
              <article
                className="pdf-sheet relative mx-auto bg-white px-10 py-10 shadow-lg"
                style={{
                  width: "794px",
                  height: "1123px",
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                  marginBottom: `${1123 * (previewScale - 1)}px`,
                }}
              >
                <header className="pb-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="mt-2 text-2xl font-bold text-mist-900">
                      運行前点検・確認記録
                    </h2>
                  </div>
                </header>

                <section className="mt-2">
                  <PreviewSection title="アルコール・体温確認記録" />
                  <PreviewRow>
                    <PreviewCell
                      label="アルコールチェック時刻"
                      value={time(check?.alcohol_check_time)}
                    />
                    <PreviewCell
                      label="体温"
                      value={
                        check?.temperature_check_value == null
                          ? "未入力"
                          : `${check.temperature_check_value} ℃`
                      }
                    />
                  </PreviewRow>
                  <PreviewRow>
                    <PreviewCell
                      label="アルコールチェック写真"
                      value={
                        check?.alcohol_check_image_url ? (
                          <img
                            src={check.alcohol_check_image_url}
                            alt="アルコールチェック"
                            className="h-28 w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-28 items-center justify-center text-xs text-mist-500">
                            未入力
                          </div>
                        )
                      }
                    />
                    <PreviewCell
                      label="体温チェック写真"
                      value={
                        check?.temperature_check_image_url ? (
                          <img
                            src={check.temperature_check_image_url}
                            alt="体温チェック"
                            className="h-28 w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-28 items-center justify-center text-xs text-mist-500">
                            未入力
                          </div>
                        )
                      }
                    />
                  </PreviewRow>

                  <div className="mt-4">
                    <PreviewSection title="車両点検項目" />
                    <div className="grid grid-cols-4 border-l border-t border-mist-400 items-center">
                      {inspectionItems.map(([key, label]) => {
                        const value = check?.[key];
                        const result =
                          value === true ? "OK" : value === false ? "NG" : "未";

                        return (
                          <div
                            key={key}
                            className="grid grid-cols-[75%_25%] border-b border-r border-mist-400 items-center"
                          >
                            <div className="px-2 py-1 text-xs text-mist-700">
                              {label}
                            </div>
                            <div className="border-l border-mist-400 px-2 py-1 text-center text-sm font-bold text-mist-600 flex justify-center">
                              {result}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <PreviewSection title="車両点検写真" />
                    <div className="grid grid-cols-4 border-l border-t border-mist-400">
                      {photoEntries.map(([label, url]) => (
                        <div
                          key={label}
                          className="border-b border-r border-mist-400 p-2"
                        >
                          <p className="mb-2 px-2 text-xs text-mist-600 font-semibold">
                            {label}
                          </p>
                          {url ? (
                            <img
                              src={url}
                              alt={label}
                              className="h-28 w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-28 items-center justify-center text-xs text-mist-500">
                              未入力
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <footer className="absolute bottom-8 left-10 right-10 border-t border-mist-300 pt-3 text-[10px] text-mist-500">
                  本帳票はアプリに保存された記録を出力したものです。
                </footer>
              </article>
            )}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
