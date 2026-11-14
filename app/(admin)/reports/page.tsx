"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PageTitle from "@/components/ui/PageTitle";
import Card from "@/components/ui/Card";
import { pdf } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import ReportPdfDocument from "@/app/(driver)/report/pdf/ReportPdfDocument";
import {
  ClipboardPen,
  Calendar,
  UserRound,
  Download,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
} from "lucide-react";

type Row = Record<string, any>;

type Report = Row & {
  id: number;
  driver_id: number;
  project_id: number;
  report_date: string;
  submitted_at: string | null;
  delivery_count: number | null;
  delivery_area: string | null;
  work_status: string | null;
};

type Driver = {
  id: number;
  name: string;
};

type Project = {
  id: number;
  name: string;
  requires_vehicle_check: boolean;
};

type PdfMode = "date" | "month";

const PAGE_SIZE = 10;

function formatDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatTime(value: unknown) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) return "";

  const text = String(value);

  if (
    text.includes('"') ||
    text.includes(",") ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function formatCheck(value: boolean | null | undefined) {
  if (value === true) return "済";
  if (value === false) return "未確認";
  return "";
}

function getMonthLastDate(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return `${year}-${String(monthNumber).padStart(2, "0")}-${String(
    lastDay,
  ).padStart(2, "0")}`;
}

/**
 * PDF用に写真を圧縮する
 * 画像の読み込みに失敗した場合は元URLを使用する
 */
async function compressImageForPdf(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();

    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const maxSize = 1200;

        const scale = Math.min(
          1,
          maxSize / Math.max(image.naturalWidth, image.naturalHeight),
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("画像を変換できませんでした。"));
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.75));
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error("画像の読み込みに失敗しました。"));
    };

    image.src = src;
  });
}

/**
 * 写真を圧縮する
 * 圧縮に失敗した場合は元のURLを返す
 */
async function safeCompressImage(
  label: string,
  url: string | null | undefined,
): Promise<string | null | undefined> {
  if (!url) return url;

  try {
    return await compressImageForPdf(url);
  } catch (error) {
    console.warn(`写真の圧縮に失敗しました：${label}`, error);
    return url;
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // 日報一覧の検索条件
  const [driverFilter, setDriverFilter] = useState<number | "">("");
  const [projectFilter, setProjectFilter] = useState<number | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  // CSV出力
  const [isExporting, setIsExporting] = useState(false);

  // PDF出力
  const [pdfProjectId, setPdfProjectId] = useState<number | "">("");
  const [pdfDriverId, setPdfDriverId] = useState<number | "">("");
  const [pdfMode, setPdfMode] = useState<PdfMode>("date");
  const [pdfDate, setPdfDate] = useState("");
  const [pdfMonth, setPdfMonth] = useState("");
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");

  /**
   * 初期データ取得
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const [
          { data: reportsData, error: reportsError },
          { data: driversData, error: driversError },
          { data: projectsData, error: projectsError },
        ] = await Promise.all([
          supabase
            .from("daily_reports")
            .select("*")
            .is("deleted_at", null)
            .order("report_date", { ascending: false })
            .order("id", { ascending: false }),

          supabase.from("drivers").select("id, name").order("name"),

          supabase
            .from("projects")
            .select("id, name, requires_vehicle_check")
            .order("name"),
        ]);

        if (reportsError) throw reportsError;
        if (driversError) throw driversError;
        if (projectsError) throw projectsError;

        setReports((reportsData ?? []) as Report[]);
        setDrivers((driversData ?? []) as Driver[]);
        setProjects(
          (projectsData ?? []).map((project) => ({
            ...project,
            requires_vehicle_check: Boolean(project.requires_vehicle_check),
          })) as Project[],
        );
      } catch (error) {
        console.error("日報一覧取得エラー:", error);
        setLoadError("日報データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  /**
   * 日報一覧の絞り込み
   */
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const driverOk = driverFilter === "" || report.driver_id === driverFilter;

      const projectOk =
        projectFilter === "" || report.project_id === projectFilter;

      const fromOk = !fromDate || report.report_date >= fromDate;
      const toOk = !toDate || report.report_date <= toDate;

      return driverOk && projectOk && fromOk && toOk;
    });
  }, [reports, driverFilter, projectFilter, fromDate, toDate]);

  const totalPages = Math.max(Math.ceil(filteredReports.length / PAGE_SIZE), 1);

  const paginatedReports = filteredReports.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  /**
   * IDからドライバー名・案件名を取得
   */
  const getDriverName = (driverId: number) => {
    return drivers.find((driver) => driver.id === driverId)?.name ?? "不明";
  };

  const getProject = (projectId: number) => {
    return projects.find((project) => project.id === projectId);
  };

  const getProjectName = (projectId: number) => {
    return getProject(projectId)?.name ?? "過去の案件";
  };

  /**
   * CSV出力
   */
  const exportCsv = async () => {
    if (filteredReports.length === 0) {
      alert("出力する日報がありません。");
      return;
    }

    setIsExporting(true);

    try {
      const headers = [
        "日報ID",
        "日付",
        "ドライバー名",
        "案件",
        "車両ナンバー",
        "勤務状況",
        "配送エリア",
        "出発場所",
        "帰着場所",
        "出庫メーター",
        "帰庫メーター",
        "走行距離",
        "業務開始時間",
        "業務終了時間",
        "休憩開始",
        "休憩終了",
        "配達完了件数",
        "不在持ち帰り件数",
        "アルコールチェック時間",
        "アルコールチェック写真",
        "ブレーキ",
        "原動機",
        "ハンドル",
        "タイヤ",
        "ワイパー",
        "クラクション",
        "ウィンカー",
        "バッテリー",
        "灯火装置",
        "非常用信号",
        "燃料",
        "冷却水",
        "オイル",
        "登録番号表",
        "検査証",
        "保険証",
        "ドラレコ",
        "備考",
        "添付ファイル",
      ];

      const rows = [...filteredReports]
        .sort((a, b) => a.report_date.localeCompare(b.report_date))
        .map((report) => {
          const startOdometer = Number(report.odometer_start ?? 0);
          const endOdometer = Number(report.odometer_end ?? 0);
          const distance = Math.max(endOdometer - startOdometer, 0);

          return [
            report.id,
            report.report_date,
            getDriverName(report.driver_id),
            getProjectName(report.project_id),
            report.plate_number ?? "",
            report.work_status ?? "",
            report.delivery_area ?? "",
            report.start_location ?? "",
            report.end_location ?? "",
            report.odometer_start ?? "",
            report.odometer_end ?? "",
            distance,
            formatTime(report.start_time),
            formatTime(report.end_time),
            formatTime(report.break_start),
            formatTime(report.break_end),
            report.delivery_count ?? "",
            report.returned_delivery_count ?? "",
            formatTime(report.alcohol_check_time),
            report.alcohol_check_image_url ?? "",
            formatCheck(report.check_brake),
            formatCheck(report.check_engine),
            formatCheck(report.check_handle),
            formatCheck(report.check_tire),
            formatCheck(report.check_wiper),
            formatCheck(report.check_horn),
            formatCheck(report.check_turn_signal),
            formatCheck(report.check_battery),
            formatCheck(report.check_light),
            formatCheck(report.check_emergency_signal),
            formatCheck(report.check_fuel),
            formatCheck(report.check_coolant),
            formatCheck(report.check_oil),
            formatCheck(report.check_license_plate),
            formatCheck(report.check_vehicle_inspection),
            formatCheck(report.check_insurance),
            formatCheck(report.check_drive_recorder),
            report.note ?? "",
            report.attachment_url ?? "",
          ];
        });

      const csv = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ].join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `日報一覧_${fromDate || "開始日未指定"}_${toDate || "終了日未指定"}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("CSV出力エラー:", error);
      alert("CSVの出力に失敗しました。");
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * PDF出力
   *
   * 案件・ドライバー・日付または月を指定して出力する。
   * 案件ごとの requires_vehicle_check に応じて点検ページを切り替える。
   */
  const exportPdf = async () => {
    if (pdfMode === "date" && !pdfDate) {
      alert("日付を選択してください。");
      return;
    }

    if (pdfMode === "month" && !pdfMonth) {
      alert("月を選択してください。");
      return;
    }

    if (projects.length === 0) {
      alert("案件情報が取得できていません。");
      return;
    }

    setIsPdfExporting(true);
    setPdfProgress("日報を取得しています...");

    try {
      const startDate = pdfMode === "date" ? pdfDate : `${pdfMonth}-01`;

      const endDate = pdfMode === "date" ? pdfDate : getMonthLastDate(pdfMonth);

      let reportQuery = supabase
        .from("daily_reports")
        .select("*")
        .gte("report_date", startDate)
        .lte("report_date", endDate)
        .is("deleted_at", null)
        .order("report_date", { ascending: true })
        .order("driver_id", { ascending: true });

      if (pdfProjectId !== "") {
        reportQuery = reportQuery.eq("project_id", pdfProjectId);
      }

      if (pdfDriverId !== "") {
        reportQuery = reportQuery.eq("driver_id", pdfDriverId);
      }

      const { data: reportData, error: reportError } = await reportQuery;

      if (reportError) throw reportError;

      if (!reportData || reportData.length === 0) {
        alert("指定した条件の日報がありません。");
        return;
      }

      const mergedPdf = await PDFDocument.create();

      for (let index = 0; index < reportData.length; index++) {
        const report = reportData[index] as Report;

        setPdfProgress(
          `PDFを作成しています... (${index + 1}/${reportData.length}件)`,
        );

        const driverName = getDriverName(report.driver_id);
        const project = getProject(report.project_id);

        const projectName = project?.name ?? "過去の案件";
        const requiresVehicleCheck = Boolean(project?.requires_vehicle_check);

        let checkData: Row | null = null;

        // 車両点検が必要な案件だけ点検データを取得
        if (requiresVehicleCheck) {
          const { data, error: checkError } = await supabase
            .from("driver_vehicle_checks")
            .select("*")
            .eq("driver_id", report.driver_id)
            .eq("check_date", report.report_date)
            .maybeSingle();

          if (checkError) throw checkError;

          checkData = data as Row | null;
        }

        const startOdometer = report.odometer_start;
        const endOdometer = report.odometer_end;

        const mileage =
          startOdometer == null || endOdometer == null
            ? null
            : Math.max(Number(endOdometer) - Number(startOdometer), 0);

        // 車両写真
        const vehiclePhotos = checkData?.vehicle_photos ?? {};

        const photoEntries: Array<[string, string | null | undefined]> =
          await Promise.all([
            safeCompressImage("車両前面", vehiclePhotos.vehicle_front).then(
              (url): [string, string | null | undefined] => ["車両前面", url],
            ),
            safeCompressImage("車両後面", vehiclePhotos.vehicle_rear).then(
              (url): [string, string | null | undefined] => ["車両後面", url],
            ),
            safeCompressImage("鍵", vehiclePhotos.vehicle_key).then(
              (url): [string, string | null | undefined] => ["鍵", url],
            ),
          ]);

        // アルコール・体温確認写真
        const compressedCheck = checkData
          ? {
              ...checkData,
              alcohol_check_image_url: await safeCompressImage(
                "アルコールチェック写真",
                checkData.alcohol_check_image_url,
              ),
              temperature_check_image_url: await safeCompressImage(
                "体温確認写真",
                checkData.temperature_check_image_url,
              ),
            }
          : null;

        const complianceRecords: [string, unknown][] = [
          ["主な経過地点", report.main_transit_points],
          ["休憩の地点", report.break_sleep_records],
          ["待機記録", report.waiting_records],
          ["荷役・附帯業務", report.cargo_handling_records],
          ["事故・異常等", report.incident_records],
        ];

        const pdfElement = createElement(ReportPdfDocument, {
          date: report.report_date,
          driverName,
          projectName,
          report,
          check: compressedCheck,
          mileage,
          photoEntries,
          complianceRecords,
          requiresVehicleCheck,
        });

        const sourceBlob = await pdf(pdfElement as any).toBlob();
        const sourceBytes = await sourceBlob.arrayBuffer();
        const sourcePdf = await PDFDocument.load(sourceBytes);

        const copiedPages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices(),
        );

        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      setPdfProgress("PDFファイルを保存しています...");

      const mergedBytes = await mergedPdf.save();

      // Uint8ArrayをArrayBufferに変換してBlobに渡す
      const pdfBuffer = new ArrayBuffer(mergedBytes.byteLength);
      new Uint8Array(pdfBuffer).set(mergedBytes);

      const blob = new Blob([pdfBuffer], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const projectName =
        pdfProjectId === ""
          ? "全案件"
          : (projects.find((project) => project.id === pdfProjectId)?.name ??
            "案件");

      const driverName =
        pdfDriverId === "" ? "全ドライバー" : getDriverName(pdfDriverId);

      const periodName = pdfMode === "date" ? pdfDate : `${pdfMonth}月`;

      const safeFileName = (value: string) =>
        value.replace(/[\\/:*?"<>|]/g, "_");

      link.href = url;
      link.download = safeFileName(
        `日報_${projectName}_${driverName}_${periodName}.pdf`,
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 60000);

      alert(`${reportData.length}件の日報をPDFにまとめました。`);
    } catch (error) {
      console.error("PDF出力エラー:", error);
      alert(
        error instanceof Error
          ? `PDFの出力に失敗しました。\n${error.message}`
          : "PDFの出力に失敗しました。",
      );
    } finally {
      setIsPdfExporting(false);
      setPdfProgress("");
    }
  };

  /**
   * フィルター変更時は1ページ目に戻す
   */
  const resetPage = () => setPage(1);

  return (
    <main className="px-4 pt-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* ページタイトル */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageTitle>日報一覧</PageTitle>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {filteredReports.length}件
            </span>

            <button
              type="button"
              onClick={exportCsv}
              disabled={isExporting || filteredReports.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={18} />
              {isExporting ? "出力中..." : "CSV出力"}
            </button>
          </div>
        </div>

        {/* PDF出力 */}
        <Card className="space-y-4 bg-white/50 px-3 md:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <FileText size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-700">日報PDF出力</h2>
              <p className="mt-1 text-sm text-gray-500">
                案件・ドライバー・期間を指定して、日報をまとめて出力できます。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-600">
                <ClipboardPen size={16} className="mr-1 inline" />
                案件
              </label>

              <select
                value={pdfProjectId}
                onChange={(e) =>
                  setPdfProjectId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={isPdfExporting}
                className="w-full rounded-lg border border-mist-200 bg-white p-3 text-gray-700"
              >
                <option value="">全案件</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-600">
                <UserRound size={16} className="mr-1 inline" />
                ドライバー
              </label>

              <select
                value={pdfDriverId}
                onChange={(e) =>
                  setPdfDriverId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={isPdfExporting}
                className="w-full rounded-lg border border-mist-200 bg-white p-3 text-gray-700"
              >
                <option value="">全ドライバー</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-600">
              <Calendar size={16} className="mr-1 inline" />
              出力期間
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPdfMode("date")}
                disabled={isPdfExporting}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  pdfMode === "date"
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-mist-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                日付を指定
              </button>

              <button
                type="button"
                onClick={() => setPdfMode("month")}
                disabled={isPdfExporting}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  pdfMode === "month"
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-mist-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                月を指定
              </button>
            </div>

            {pdfMode === "date" ? (
              <input
                type="date"
                value={pdfDate}
                onChange={(e) => setPdfDate(e.target.value)}
                disabled={isPdfExporting}
                className="w-full rounded-lg border border-mist-200 bg-white p-3 text-gray-700"
              />
            ) : (
              <input
                type="month"
                value={pdfMonth}
                onChange={(e) => setPdfMonth(e.target.value)}
                disabled={isPdfExporting}
                className="w-full rounded-lg border border-mist-200 bg-white p-3 text-gray-700"
              />
            )}
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <p>
              案件：{" "}
              <strong>
                {pdfProjectId === ""
                  ? "全案件"
                  : projects.find((p) => p.id === pdfProjectId)?.name}
              </strong>
            </p>
            <p className="mt-1">
              ドライバー：{" "}
              <strong>
                {pdfDriverId === "" ? "全員" : getDriverName(pdfDriverId)}
              </strong>
            </p>
            <p className="mt-1">
              期間：{" "}
              <strong>
                {pdfMode === "date"
                  ? pdfDate
                    ? formatDate(pdfDate)
                    : "未指定"
                  : pdfMonth
                    ? `${pdfMonth.replace("-", "年")}月`
                    : "未指定"}
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={exportPdf}
            disabled={
              isPdfExporting || (pdfMode === "date" ? !pdfDate : !pdfMonth)
            }
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={19} />
            {isPdfExporting ? "PDF作成中..." : "PDFをまとめてダウンロード"}
          </button>

          {isPdfExporting && (
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full w-full animate-pulse rounded-full bg-teal-600" />
              </div>
              <p className="text-center text-xs text-gray-500">
                {pdfProgress || "PDFを作成しています..."}
              </p>
            </div>
          )}

          <p className="text-xs leading-relaxed text-gray-500">
            ※全案件を選択した場合、指定期間内の日報を案件横断で出力します。
            車両点検ページは各案件の設定に応じて自動で追加されます。
          </p>
        </Card>

        {/* 日報一覧フィルター */}
        <Card className="space-y-4 bg-white/50 px-3 md:p-5">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <Filter size={18} />
            日報を絞り込む
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">ドライバー</label>
              <select
                value={driverFilter}
                onChange={(e) => {
                  setDriverFilter(e.target.value ? Number(e.target.value) : "");
                  resetPage();
                }}
                className="w-full rounded-lg border border-mist-200 bg-white p-3 text-sm text-gray-700"
              >
                <option value="">全ドライバー</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">案件</label>
              <select
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(
                    e.target.value ? Number(e.target.value) : "",
                  );
                  resetPage();
                }}
                className="w-full rounded-lg border border-mist-200 bg-white p-3 text-sm text-gray-700"
              >
                <option value="">全案件</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">開始日</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  resetPage();
                }}
                className="w-full rounded-lg border border-mist-200 bg-white p-3 text-sm text-gray-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">終了日</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  resetPage();
                }}
                className="w-full rounded-lg border border-mist-200 bg-white p-3 text-sm text-gray-700"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              検索結果：{filteredReports.length}件
            </p>

            <button
              type="button"
              onClick={() => {
                setDriverFilter("");
                setProjectFilter("");
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 text-sm text-teal-700 hover:underline"
            >
              <Search size={15} />
              条件をリセット
            </button>
          </div>
        </Card>

        {/* 日報一覧 */}
        <Card className="space-y-3 bg-white/50 px-3 md:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">日報一覧</h2>
            <span className="text-xs text-gray-500">
              {filteredReports.length}件
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">
              日報を読み込んでいます...
            </div>
          ) : loadError ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {loadError}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              該当する日報がありません。
            </div>
          ) : (
            <>
              {/* PC表示 */}
              <div className="hidden overflow-hidden rounded-lg border border-mist-200 md:block">
                <div className="grid grid-cols-[1.1fr_1.3fr_1.2fr_0.8fr_0.9fr_0.8fr] gap-3 bg-mist-200 px-4 py-3 text-xs font-semibold text-gray-600">
                  <div>日付</div>
                  <div>ドライバー</div>
                  <div>案件</div>
                  <div>配送数</div>
                  <div>提出状況</div>
                  <div className="text-center">詳細</div>
                </div>

                {paginatedReports.map((report) => {
                  const submitted = Boolean(report.submitted_at);

                  return (
                    <div
                      key={report.id}
                      className="grid grid-cols-[1.1fr_1.3fr_1.2fr_0.8fr_0.9fr_0.8fr] items-center gap-3 border-t border-mist-200 bg-white px-4 py-3 text-sm text-gray-700"
                    >
                      <div>{formatDate(report.report_date)}</div>

                      <div className="font-medium">
                        {getDriverName(report.driver_id)}
                      </div>

                      <div>{getProjectName(report.project_id)}</div>

                      <div>
                        {report.work_status === "欠勤"
                          ? "—"
                          : `${report.delivery_count ?? 0}個`}
                      </div>

                      <div>
                        {submitted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <CheckCircle2 size={14} />
                            提出済み
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <Clock size={14} />
                            未提出
                          </span>
                        )}
                      </div>

                      <div className="text-center">
                        <Link
                          href={`/reports/${report.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
                        >
                          詳細
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* スマホ表示 */}
              <div className="space-y-3 md:hidden">
                {paginatedReports.map((report) => {
                  const submitted = Boolean(report.submitted_at);

                  return (
                    <div
                      key={report.id}
                      className="space-y-3 rounded-xl border border-mist-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500">
                            {formatDate(report.report_date)}
                          </p>
                          <p className="mt-1 text-base font-semibold text-gray-800">
                            {getDriverName(report.driver_id)}
                          </p>
                        </div>

                        {submitted ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <CheckCircle2 size={14} />
                            提出済み
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <Clock size={14} />
                            未提出
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-mist-100 pt-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">案件</p>
                          <p className="mt-1 font-medium text-gray-700">
                            {getProjectName(report.project_id)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">配送数</p>
                          <p className="mt-1 font-medium text-gray-700">
                            {report.work_status === "欠勤"
                              ? "—"
                              : `${report.delivery_count ?? 0}個`}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/reports/${report.id}`}
                        className="flex w-full items-center justify-center rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                      >
                        日報の詳細を見る
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* ページネーション */}
        {!loading && filteredReports.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page === 1}
              className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              前へ
            </button>

            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(current + 1, totalPages))
              }
              disabled={page === totalPages}
              className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
