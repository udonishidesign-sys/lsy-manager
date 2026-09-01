"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import {
  UserRound,
  Calendar,
  Clock,
  Package,
  Van,
  CircleCheckBig,
  ChevronLeft,
  FileText,
  Wine,
} from "lucide-react";

type Driver = {
  id: number;
  name: string;
};

type Report = {
  id: number;
  driver_id: number;
  project_id: number | null;
  plate_number: string | null;
  report_date: string;
  delivery_count: number | null;
  returned_delivery_count: number | null;
  delivery_area: string | null;
  work_status: string | null;
  absence_reason: string | null;
  start_time: string | null;
  end_time: string | null;
  break_start: string | null;
  break_end: string | null;
  start_location: string | null;
  end_location: string | null;
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

  note: string | null;
};

type Project = {
  id: number;
  name: string;
};

const checkItems: {
  key: keyof Report;
  label: string;
}[] = [
  { key: "check_brake", label: "ブレーキ" },
  { key: "check_engine", label: "原動機" },
  { key: "check_handle", label: "ハンドル" },
  { key: "check_tire", label: "タイヤ" },
  { key: "check_wiper", label: "ワイパー" },
  { key: "check_horn", label: "クラクション" },
  { key: "check_turn_signal", label: "ウィンカー" },
  { key: "check_battery", label: "バッテリー" },
  { key: "check_light", label: "灯火装置" },
  { key: "check_emergency_signal", label: "非常用信号" },
  { key: "check_fuel", label: "燃料" },
  { key: "check_coolant", label: "冷却水" },
  { key: "check_oil", label: "オイル" },
  { key: "check_license_plate", label: "登録番号表" },
  { key: "check_vehicle_inspection", label: "検査証" },
  { key: "check_insurance", label: "保険証" },
  { key: "check_drive_recorder", label: "ドラレコ動作確認" },
];

const formatTime = (value: string | null) => {
  if (!value) return "-";
  return value.slice(0, 5);
};

const formatNumber = (value: number | null) => {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString();
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex justify-between gap-4 py-3 border-b border-gray-100 last:border-none">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>

      <span className="text-sm text-slate-700 text-right break-words">
        {value}
      </span>
    </div>
  );
};

const SectionTitle = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-teal-500">
      <span className="text-teal-500">{icon}</span>

      <h2 className="font-bold text-slate-800">{title}</h2>
    </div>
  );
};

export default function ClientDriverReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  /*
   * -----------------------------------------
   * URLパラメータ取得
   *
   * /client/drivers/[id]/reports/[reportId]
   * -----------------------------------------
   */
  const driverId = Number(params.id);
  const reportId = Number(params.reportId);

  /*
   * 一覧画面で選択していた月
   *
   * 例：
   * ?month=2026-08
   */
  const selectedMonth = searchParams.get("month") || "";

  const [driver, setDriver] = useState<Driver | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError("");

      /*
       * -----------------------------------------
       * IDチェック
       * -----------------------------------------
       */
      if (
        !driverId ||
        Number.isNaN(driverId) ||
        !reportId ||
        Number.isNaN(reportId)
      ) {
        setError("日報情報が正しくありません。");
        setLoading(false);
        return;
      }

      /*
       * -----------------------------------------
       * ログイン状態確認
       * -----------------------------------------
       */
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/client/login");
        return;
      }

      /*
       * -----------------------------------------
       * ログイン中の受託先を取得
       * -----------------------------------------
       */
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", session.user.email)
        .single();

      if (clientError || !client) {
        console.error(clientError);

        setError("受託先情報を取得できませんでした。");
        setLoading(false);

        return;
      }

      /*
       * -----------------------------------------
       * ドライバーが受託先に紐づいているか確認
       * -----------------------------------------
       */
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("id, name")
        .eq("id", driverId)
        .eq("client_id", client.id)
        .single();

      if (driverError || !driverData) {
        console.error(driverError);

        setError("このドライバーの日報を閲覧する権限がありません。");

        setLoading(false);

        return;
      }

      setDriver(driverData);

      /*
       * -----------------------------------------
       * 日報取得
       * -----------------------------------------
       */
      const { data: reportData, error: reportError } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", reportId)
        .eq("driver_id", driverId)
        .is("deleted_at", null)
        .single();

      if (reportError || !reportData) {
        console.error(reportError);

        setError("日報を取得できませんでした。");
        setLoading(false);

        return;
      }

      /*
       * -----------------------------------------
       * 案件取得
       *
       * 案件＝受託先なので、
       * 日報のproject_idから取得
       * -----------------------------------------
       */
      if (reportData.project_id) {
        const { data: projectData } = await supabase
          .from("projects")
          .select("id, name")
          .eq("id", reportData.project_id)
          .eq("client_id", client.id)
          .maybeSingle();

        if (projectData) {
          setProject(projectData);
        }
      }

      setReport(reportData);
      setLoading(false);
    };

    loadReport();
  }, [driverId, reportId, router]);

  /*
   * -----------------------------------------
   * 日報一覧へ戻る
   *
   * 選択していた月を維持する
   * -----------------------------------------
   */
  const goBackToReports = () => {
    const url = selectedMonth
      ? `/client/drivers/${driverId}/reports?month=${encodeURIComponent(
          selectedMonth,
        )}`
      : `/client/drivers/${driverId}/reports`;

    router.push(url);
  };

  /*
   * -----------------------------------------
   * ローディング
   * -----------------------------------------
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 pt-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </main>
    );
  }

  /*
   * -----------------------------------------
   * エラー
   * -----------------------------------------
   */
  if (error || !report) {
    return (
      <main className="min-h-screen bg-white px-4 pt-24">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl bg-red-50 border border-red-200 p-5">
            <p className="text-sm text-red-600 whitespace-pre-wrap">
              {error || "日報が見つかりませんでした。"}
            </p>

            <button
              type="button"
              onClick={goBackToReports}
              className="mt-4 px-4 py-2 rounded-lg bg-teal-500 text-white font-bold hover:cursor-pointer"
            >
              日報一覧へ戻る
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * -----------------------------------------
   * 計算
   * -----------------------------------------
   */
  const distance = Math.max(
    Number(report.odometer_end ?? 0) - Number(report.odometer_start ?? 0),
    0,
  );

  const isAbsent = report.work_status === "欠勤";

  /*
   * -----------------------------------------
   * 表示
   * -----------------------------------------
   */
  return (
    <main className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* ヘッダー */}
        <div>
          <button
            type="button"
            onClick={goBackToReports}
            className="flex items-center gap-1 text-sm text-teal-600 mb-4 hover:cursor-pointer"
          >
            <ChevronLeft size={18} />
            日報一覧
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center">
              <UserRound size={24} className="text-teal-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {driver?.name}
              </h1>

              <p className="text-sm text-gray-500">
                {report.report_date} の日報詳細
              </p>
            </div>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <SectionTitle icon={<Calendar size={22} />} title="基本情報" />

          <div>
            <DetailRow label="日付" value={report.report_date} />

            <DetailRow
              label="車両ナンバー"
              value={report.plate_number || "-"}
            />

            <DetailRow label="勤務区分" value={report.work_status || "-"} />

            {isAbsent && (
              <DetailRow
                label="欠勤理由"
                value={report.absence_reason || "-"}
              />
            )}
          </div>
        </div>

        {/* 欠勤の場合は勤務内容を表示しない */}
        {!isAbsent && (
          <>
            {/* アルコールチェック */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <SectionTitle
                icon={<Wine size={22} />}
                title="アルコールチェック"
              />

              <div>
                <DetailRow
                  label="チェック時間"
                  value={formatTime(report.alcohol_check_time)}
                />
              </div>

              {report.alcohol_check_image_url && (
                <div className="pt-2">
                  <a
                    href={report.alcohol_check_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full h-12 rounded-lg border border-teal-500 text-teal-600 font-bold"
                  >
                    アルコールチェック写真を見る
                  </a>
                </div>
              )}
            </div>

            {/* 運行前点検 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <SectionTitle
                icon={<CircleCheckBig size={22} />}
                title="運行前点検"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 mt-3">
                {checkItems.map((item) => {
                  const checked = report[item.key] === true;

                  return (
                    <div
                      key={String(item.key)}
                      className="flex items-center justify-between py-3 border-b border-gray-100"
                    >
                      <span className="text-sm text-gray-600">
                        {item.label}
                      </span>

                      <span
                        className={
                          checked
                            ? "text-sm font-bold text-teal-600"
                            : "text-sm font-bold text-gray-400"
                        }
                      >
                        {checked ? "✓ 点検済み" : "未確認"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 走行情報 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <SectionTitle icon={<Van size={22} />} title="走行情報" />

              <div>
                <DetailRow
                  label="配送エリア"
                  value={report.delivery_area || "-"}
                />

                <DetailRow
                  label="出発場所"
                  value={report.start_location || "-"}
                />

                <DetailRow
                  label="帰着場所"
                  value={report.end_location || "-"}
                />

                <DetailRow
                  label="出庫メーター"
                  value={
                    report.odometer_start !== null
                      ? `${formatNumber(report.odometer_start)} km`
                      : "-"
                  }
                />

                <DetailRow
                  label="帰庫メーター"
                  value={
                    report.odometer_end !== null
                      ? `${formatNumber(report.odometer_end)} km`
                      : "-"
                  }
                />
              </div>

              <div className="bg-slate-100 rounded-lg p-4 flex justify-between">
                <span className="text-sm text-slate-500">走行距離</span>

                <span className="font-bold text-slate-700">
                  {distance.toLocaleString()} km
                </span>
              </div>
            </div>

            {/* 勤務時間 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <SectionTitle icon={<Clock size={22} />} title="勤務時間" />

              <div>
                <DetailRow
                  label="業務開始時間"
                  value={formatTime(report.start_time)}
                />

                <DetailRow
                  label="休憩開始"
                  value={formatTime(report.break_start)}
                />

                <DetailRow
                  label="休憩終了"
                  value={formatTime(report.break_end)}
                />

                <DetailRow
                  label="業務終了時間"
                  value={formatTime(report.end_time)}
                />
              </div>
            </div>

            {/* 配送実績 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <SectionTitle icon={<Package size={22} />} title="配送実績" />

              <div>
                <DetailRow
                  label="配達完了件数"
                  value={`${formatNumber(report.delivery_count)} 件`}
                />
              </div>
            </div>
          </>
        )}

        {/* 備考 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <SectionTitle icon={<FileText size={22} />} title="備考" />

          <div className="rounded-lg bg-slate-50 p-4 min-h-[100px]">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {report.note || "記載なし"}
            </p>
          </div>
        </div>

        {/* 戻る */}
        <button
          type="button"
          onClick={goBackToReports}
          className="w-full h-12 rounded-lg border border-teal-500 text-teal-600 font-bold bg-white hover:cursor-pointer"
        >
          日報一覧へ戻る
        </button>
      </div>
    </main>
  );
}
