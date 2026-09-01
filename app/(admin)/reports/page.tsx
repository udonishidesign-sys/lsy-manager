"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PageTitle from "@/components/ui/PageTitle";
import PageActions from "@/components/ui/PageActions";
import Card from "@/components/ui/Card";

import {
  ClipboardPen,
  Calendar,
  Package,
  UserRound,
  JapaneseYen,
  Download,
} from "lucide-react";

type Report = {
  id: number;
  driver_id: number;
  project_id: number;
  report_date: string;

  plate_number: string | null;

  delivery_count: number | null;
  returned_delivery_count: number | null;
  delivery_area: string | null;

  unit_price: number | null;

  work_status: string | null;
  note: string | null;
  attachment_url: string | null;

  start_time: string | null;
  end_time: string | null;
  start_location: string | null;
  end_location: string | null;
  break_start: string | null;
  break_end: string | null;

  odometer_start: number | null;
  odometer_end: number | null;

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

type Driver = {
  id: number;
  name: string;
};

type Project = {
  id: number;
  name: string;
};

function formatYen(value: number | null | undefined) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [driverFilter, setDriverFilter] = useState<number | "">("");
  const [projectFilter, setProjectFilter] = useState<number | "">("");

  const [page, setPage] = useState(1);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [isExporting, setIsExporting] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    const fetchData = async () => {
      const { data: reportsData, error: reportsError } = await supabase
        .from("daily_reports")
        .select("*")
        .is("deleted_at", null)
        .order("report_date", { ascending: false });

      if (reportsError) {
        console.error("日報取得エラー:", reportsError);
      }

      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("id, name");

      if (driversError) {
        console.error("ドライバー取得エラー:", driversError);
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name");

      if (projectsError) {
        console.error("案件取得エラー:", projectsError);
      }

      setReports(reportsData ?? []);
      setDrivers(driversData ?? []);
      setProjects(projectsData ?? []);
    };

    fetchData();
  }, []);

  /*
   * ----------------------------------------
   * 表示用フィルター
   * ----------------------------------------
   */
  const filteredReports = reports.filter((r) => {
    const driverOk = driverFilter === "" || r.driver_id === driverFilter;

    const projectOk = projectFilter === "" || r.project_id === projectFilter;

    const fromOk = !fromDate || r.report_date >= fromDate;

    const toOk = !toDate || r.report_date <= toDate;

    return driverOk && projectOk && fromOk && toOk;
  });

  const start = (page - 1) * pageSize;

  const paginatedReports = filteredReports.slice(start, start + pageSize);

  const totalPages = Math.max(Math.ceil(filteredReports.length / pageSize), 1);

  /*
   * ----------------------------------------
   * CSV用エスケープ
   * ----------------------------------------
   */
  const escapeCsv = (value: unknown) => {
    if (value === null || value === undefined) {
      return "";
    }

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
  };

  /*
   * ----------------------------------------
   * 時刻を HH:MM に整形
   * ----------------------------------------
   */
  const formatTime = (value: string | null) => {
    if (!value) return "";

    return value.length >= 5 ? value.slice(0, 5) : value;
  };

  /*
   * ----------------------------------------
   * 点検結果
   * ----------------------------------------
   */
  const formatCheck = (value: boolean | null) => {
    if (value === true) return "済";
    if (value === false) return "未確認";
    return "";
  };

  /*
   * ----------------------------------------
   * CSV出力
   *
   * 現在のフィルター条件に一致する
   * 全日報を出力する
   *
   * 単価・売上・伝票関連は除外
   * ----------------------------------------
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
        .map((r) => {
          const driverName =
            drivers.find((d) => d.id === r.driver_id)?.name ?? "不明";

          const projectName =
            projects.find((p) => p.id === r.project_id)?.name ?? "不明";

          const startOdometer = r.odometer_start ?? 0;
          const endOdometer = r.odometer_end ?? 0;

          const distance = Math.max(endOdometer - startOdometer, 0);

          return [
            r.id,
            r.report_date,
            driverName,
            projectName,
            r.plate_number ?? "",
            r.work_status ?? "",

            r.delivery_area ?? "",
            r.start_location ?? "",
            r.end_location ?? "",
            r.odometer_start ?? "",
            r.odometer_end ?? "",
            distance,

            formatTime(r.start_time),
            formatTime(r.end_time),
            formatTime(r.break_start),
            formatTime(r.break_end),

            r.delivery_count ?? "",
            r.returned_delivery_count ?? "",

            formatTime(r.alcohol_check_time),
            r.alcohol_check_image_url ?? "",

            formatCheck(r.check_brake),
            formatCheck(r.check_engine),
            formatCheck(r.check_handle),
            formatCheck(r.check_tire),
            formatCheck(r.check_wiper),
            formatCheck(r.check_horn),
            formatCheck(r.check_turn_signal),
            formatCheck(r.check_battery),
            formatCheck(r.check_light),
            formatCheck(r.check_emergency_signal),
            formatCheck(r.check_fuel),
            formatCheck(r.check_coolant),
            formatCheck(r.check_oil),
            formatCheck(r.check_license_plate),
            formatCheck(r.check_vehicle_inspection),
            formatCheck(r.check_insurance),
            formatCheck(r.check_drive_recorder),

            r.note ?? "",
            r.attachment_url ?? "",
          ];
        });

      const csv = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ].join("\r\n");

      /*
       * UTF-8 BOMを付けることで、
       * Excel / Googleスプレッドシートで
       * 日本語が文字化けしにくくする
       */
      const bom = "\uFEFF";

      const blob = new Blob([bom + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      const dateFrom = fromDate || "開始日未指定";

      const dateTo = toDate || "終了日未指定";

      link.download = `日報一覧_${dateFrom}_${dateTo}.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV出力エラー:", error);
      alert("CSVの出力に失敗しました。");
    } finally {
      setIsExporting(false);
    }
  };

  /*
   * ----------------------------------------
   * フィルター変更時は1ページ目へ戻す
   * ----------------------------------------
   */
  const changeDriverFilter = (value: number | "") => {
    setDriverFilter(value);
    setPage(1);
  };

  const changeProjectFilter = (value: number | "") => {
    setProjectFilter(value);
    setPage(1);
  };

  const changeFromDate = (value: string) => {
    setFromDate(value);
    setPage(1);
  };

  const changeToDate = (value: string) => {
    setToDate(value);
    setPage(1);
  };

  return (
    <main className="px-4 pt-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* ----------------------------------------
            タイトル
        ---------------------------------------- */}
        <div className="flex items-center justify-between gap-3">
          <PageTitle>日報一覧</PageTitle>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {filteredReports.length}件
            </span>

            <button
              type="button"
              onClick={exportCsv}
              disabled={isExporting || filteredReports.length === 0}
              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                rounded-lg
                bg-teal-600
                text-white
                text-sm
                font-semibold
                hover:bg-teal-700
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition
              "
            >
              <Download size={18} />

              {isExporting ? "出力中..." : "CSV出力"}
            </button>
          </div>
        </div>

        {/* ----------------------------------------
            フィルター
        ---------------------------------------- */}
        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          <div className="flex gap-6 md:mt-4 mt-0 flex-wrap md:flex-nowrap">
            <div className="flex md:gap-6 gap-4 md:w-3/5 w-full">
              <select
                value={driverFilter}
                onChange={(e) =>
                  changeDriverFilter(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="
                  border
                  p-2
                  rounded
                  w-full
                  text-gray-500
                  bg-white
                  border-mist-200
                "
              >
                <option value="">全ドライバー</option>

                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={projectFilter}
                onChange={(e) =>
                  changeProjectFilter(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="
                  border
                  p-2
                  rounded
                  w-full
                  text-gray-500
                  bg-white
                  border-mist-200
                "
              >
                <option value="">全案件</option>

                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 items-center md:w-auto mt-2 md:mt-0">
              <div className="relative w-full">
                <label className="absolute -top-5 block text-xs text-gray-500">
                  開始日
                </label>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => changeFromDate(e.target.value)}
                  className="
                    border
                    p-2
                    rounded
                    w-full
                    bg-white
                    text-gray-500
                    border-mist-200
                  "
                />
              </div>

              <p className="block text-xs text-gray-500">〜</p>

              <div className="relative w-full">
                <label className="absolute -top-5 block text-xs text-gray-500">
                  終了日
                </label>

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => changeToDate(e.target.value)}
                  className="
                    border
                    p-2
                    rounded
                    w-full
                    bg-white
                    text-gray-500
                    border-mist-200
                  "
                />
              </div>
            </div>
          </div>
        </Card>

        {/* ----------------------------------------
            日報一覧
        ---------------------------------------- */}
        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          <div className="border rounded overflow-hidden border-mist-200">
            <div className="md:flex justify-between bg-mist-200 px-4 py-2 hidden">
              <p className="font-semibold text-gray-600 w-1/7 text-left flex gap-1">
                <Calendar size={20} />
                日付
              </p>

              <p className="font-semibold text-gray-600 w-full md:w-1/7 text-left flex gap-1">
                <UserRound size={20} />
                ドライバー名
              </p>

              <p className="font-semibold text-gray-600 w-2/10 text-left flex gap-1">
                <ClipboardPen size={20} />
                案件
              </p>

              <p className="font-semibold text-gray-600 w-1/8 text-left flex gap-1">
                <Package size={20} />
                配送数
              </p>

              <p className="font-semibold text-gray-600 w-1/7 text-left flex gap-1">
                <JapaneseYen size={20} />
                売上
              </p>

              <p className="font-semibold text-gray-600 w-1/10 text-left"></p>
            </div>

            {filteredReports.length === 0 ? (
              <div className="p-4">日報がありません</div>
            ) : (
              paginatedReports.map((r) => {
                const driverName =
                  drivers.find((d) => d.id === r.driver_id)?.name ?? "不明";

                const projectName =
                  projects.find((p) => p.id === r.project_id)?.name ?? "不明";

                /*
                 * 一覧表示用の売上計算
                 *
                 * CSVには出力しません。
                 */
                const unitPrice =
                  (
                    r as Report & {
                      unit_price?: number | null;
                    }
                  ).unit_price ?? 0;

                const sales = (r.delivery_count ?? 0) * unitPrice;

                return (
                  <div
                    key={r.id}
                    className="
                      flex
                      justify-between
                      flex-col
                      md:flex-row
                      items-center
                      bg-white
                      md:px-4
                      md:py-2
                      px-4
                      py-4
                      border-b
                      last:border-none
                    "
                  >
                    <p
                      className="
                      text-gray-600
                      w-full
                      md:w-1/7
                      text-left
                      text-bold
                      text-lg
                      flex
                      justify-between
                      border-dotted
                      border-b
                      border-mist-200
                      md:border-none
                      !py-2
                    "
                    >
                      <label
                        className="
                        md:hidden
                        text-sm
                        mr-2
                        flex
                        items-center
                        gap-1
                      "
                      >
                        <Calendar size={24} className="text-teal-500" />

                        <span>日付</span>
                      </label>

                      {r.report_date}
                    </p>

                    <p
                      className="
                      text-gray-600
                      w-full
                      md:w-1/7
                      text-left
                      text-lg
                      flex
                      justify-between
                      border-b
                      border-dotted
                      border-mist-200
                      md:border-none
                      !py-2
                    "
                    >
                      <label
                        className="
                        md:hidden
                        text-sm
                        mr-2
                        flex
                        items-center
                        gap-1
                      "
                      >
                        <UserRound size={24} className="text-teal-500" />

                        <span>ドライバー</span>
                      </label>

                      {driverName}
                    </p>

                    <p
                      className="
                      text-gray-600
                      w-full
                      md:w-2/10
                      text-left
                      text-lg
                      flex
                      justify-between
                      border-b
                      border-dotted
                      border-mist-200
                      md:border-none
                      !py-2
                    "
                    >
                      <label
                        className="
                        md:hidden
                        text-sm
                        mr-2
                        flex
                        items-center
                        gap-1
                      "
                      >
                        <ClipboardPen size={24} className="text-teal-500" />

                        <span>案件</span>
                      </label>

                      {projectName}
                    </p>

                    <p
                      className="
                      text-gray-600
                      w-full
                      md:w-1/8
                      text-left
                      text-lg
                      flex
                      justify-between
                      border-b
                      border-dotted
                      border-mist-200
                      md:border-none
                      !py-2
                    "
                    >
                      <label
                        className="
                        md:hidden
                        text-sm
                        mr-2
                        flex
                        items-center
                        gap-1
                      "
                      >
                        <Package size={24} className="text-teal-500" />

                        <span>配送数</span>
                      </label>

                      <span>
                        {r.delivery_count ?? 0}個
                        {r.delivery_area && (
                          <span className="block text-xs text-gray-400">
                            {r.delivery_area}
                          </span>
                        )}
                      </span>
                    </p>

                    <p
                      className="
                      text-gray-600
                      w-full
                      md:w-1/7
                      text-left
                      text-lg
                      flex
                      justify-between
                      border-b
                      border-dotted
                      border-mist-200
                      md:border-none
                      !py-2
                    "
                    >
                      <label
                        className="
                        md:hidden
                        text-sm
                        mr-2
                        flex
                        items-center
                        gap-1
                      "
                      >
                        <JapaneseYen size={24} className="text-teal-500" />

                        <span>売上</span>
                      </label>

                      {formatYen(sales)}
                    </p>

                    <div
                      className="
                      text-gray-600
                      w-full
                      md:w-1/10
                      text-left
                      md:mt-0
                      mt-4
                      hidden
                      md:block
                    "
                    >
                      <PageActions
                        actions={[
                          {
                            type: "detail",
                            href: `/reports/${r.id}`,
                            label: "詳細",
                            className: "w-full",
                          },
                        ]}
                      />
                    </div>

                    <div
                      className="
                      text-gray-600
                      w-full
                      md:w-1/10
                      text-left
                      md:mt-0
                      mt-4
                      block
                      md:hidden
                    "
                    >
                      <PageActions
                        actions={[
                          {
                            type: "detail",
                            href: `/reports/${r.id}`,
                            label: "詳細を見る",
                            className: "w-full",
                          },
                        ]}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* ----------------------------------------
          ページング
      ---------------------------------------- */}
      <div
        className="
        flex
        justify-center
        items-center
        gap-4
        mt-4
      "
      >
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="
            px-3
            py-1
            border
            border-teal-600
            text-teal-600
            rounded-lg
            hover:text-white
            hover:bg-teal-600
            cursor-pointer
            disabled:opacity-40
            disabled:cursor-not-allowed
            disabled:hover:bg-transparent
            disabled:hover:text-teal-600
          "
        >
          前へ
        </button>

        <span className="text-sm text-gray-600">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="
            px-3
            py-1
            border
            border-teal-600
            text-teal-600
            rounded-lg
            hover:text-white
            hover:bg-teal-600
            cursor-pointer
            disabled:opacity-40
            disabled:cursor-not-allowed
            disabled:hover:bg-transparent
            disabled:hover:text-teal-600
          "
        >
          次へ
        </button>
      </div>
    </main>
  );
}
