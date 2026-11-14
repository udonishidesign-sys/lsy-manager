"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getDriverSessionId } from "@/lib/driver-session";
import AuthGuard from "@/components/AuthGuard";
import FieldStatus from "@/components/ui/FieldStatus";
import { getLocalDraft } from "@/lib/local-drafts";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  ClipboardPen,
  FileText,
  History,
  AlertCircle,
} from "lucide-react";

type Project = {
  id: number;
  name: string;
  requires_vehicle_check: boolean;
};

type InputStatus = "empty" | "inProgress" | "saved" | "submitted";

type TodayState = {
  driverName: string;
  driverId: string | null;
  projects: Project[];
  selectedProjectId: number | null;
  reportProjectId: number | null;
  check: boolean;
  reportStatus: InputStatus;
  checkStatus: InputStatus;
  loading: boolean;
};

// 今日の日付
function localDate() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// 日付表示
function formatDate(date: string) {
  const [y, m, d] = date.split("-");

  return `${y}年${Number(m)}月${Number(d)}日`;
}

// 案件選択の保存キー
function projectSelectionKey(driverId: string, date: string) {
  return `report-selected-project:${driverId}:${date}`;
}

// 値が入力されているか判定
function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (Array.isArray(value)) {
    return value.some(hasValue);
  }

  if (typeof value === "object") {
    if (typeof Blob !== "undefined" && value instanceof Blob) {
      return value.size > 0;
    }

    return Object.values(value as Record<string, unknown>).some(hasValue);
  }

  return Boolean(value);
}

// 日報の下書きに入力があるか判定
function hasReportDraftInput(draft: Record<string, unknown> | null): boolean {
  if (!draft) return false;

  const inputFields = [
    "deliveryCount",
    "actualStartLocation",
    "actualEndLocation",
    "mainTransitPoints",
    "breakSleepRecords",
    "workStatus",
    "note",
    "startTime",
    "endTime",
    "breakStart",
    "breakEnd",
    "odometerStart",
    "odometerEnd",
    "carryOutAm",
    "carryOutPm",
    "carryBackAm",
    "carryBackPm",
    "lastDeliveryAm",
    "lastDeliveryPm",
    "collectionCount",
    "absenceReason",
    "returnedDeliveryCount",
  ];

  return inputFields.some((field) => hasValue(draft[field]));
}

// 車両点検の下書きに入力があるか判定
function hasCheckDraftInput(draft: Record<string, unknown> | null): boolean {
  if (!draft) return false;

  const checks = draft.checks;

  const hasCheckedItem =
    typeof checks === "object" &&
    checks !== null &&
    Object.values(checks as Record<string, unknown>).some(
      (value) => value === true,
    );

  return (
    hasCheckedItem ||
    hasValue(draft.alcoholCheckTime) ||
    hasValue(draft.alcoholCheckFile) ||
    hasValue(draft.alcoholCheckImageUrl) ||
    hasValue(draft.temperatureCheckValue) ||
    hasValue(draft.temperatureCheckFile) ||
    hasValue(draft.temperatureCheckImageUrl) ||
    hasValue(draft.photoFiles) ||
    hasValue(draft.photoUrls)
  );
}

export default function ReportHomePage() {
  const [today, setToday] = useState("");

  const [state, setState] = useState<TodayState>({
    driverName: "",
    driverId: null,
    projects: [],
    selectedProjectId: null,
    reportProjectId: null,
    check: false,
    reportStatus: "empty",
    checkStatus: "empty",
    loading: true,
  });

  useEffect(() => {
    const date = localDate();
    setToday(date);

    const load = async () => {
      const driverId = getDriverSessionId();

      if (!driverId) {
        setState((current) => ({
          ...current,
          loading: false,
        }));
        return;
      }

      // ドライバー情報・担当案件・今日の日報・点検を取得
      const [driverResult, driverProjectsResult, reportResult, checkResult] =
        await Promise.all([
          supabase
            .from("drivers")
            .select("name")
            .eq("id", driverId)
            .maybeSingle(),

          supabase
            .from("driver_projects")
            .select("project_id")
            .eq("driver_id", driverId),

          supabase
            .from("daily_reports")
            .select("id, project_id, submitted_at")
            .eq("driver_id", driverId)
            .eq("report_date", date)
            .is("deleted_at", null)
            .maybeSingle(),

          supabase
            .from("driver_vehicle_checks")
            .select("check_date, submitted_at")
            .eq("driver_id", driverId)
            .eq("check_date", date)
            .maybeSingle(),
        ]);

      // ローカル下書きを取得
      let reportDraft: Record<string, unknown> | null = null;
      let checkDraft: Record<string, unknown> | null = null;

      try {
        const [reportDraftResult, checkDraftResult] = await Promise.all([
          getLocalDraft<Record<string, unknown>>(
            `daily-report:${driverId}:${date}`,
          ),
          getLocalDraft<Record<string, unknown>>(
            `vehicle-check:${driverId}:${date}`,
          ),
        ]);

        reportDraft = reportDraftResult;
        checkDraft = checkDraftResult;
      } catch (error) {
        console.warn("下書きの取得に失敗しました", error);
      }

      // 保存済みデータを優先してステータスを決定
      const reportStatus: InputStatus = reportResult.data
        ? reportResult.data.submitted_at
          ? "submitted"
          : "saved"
        : hasReportDraftInput(reportDraft)
          ? "inProgress"
          : "empty";

      const checkStatus: InputStatus = checkResult.data
        ? checkResult.data.submitted_at
          ? "submitted"
          : "saved"
        : hasCheckDraftInput(checkDraft)
          ? "inProgress"
          : "empty";

      // 担当案件を取得
      const projectIds =
        driverProjectsResult.data?.map((item) => item.project_id) ?? [];

      let projects: Project[] = [];

      if (projectIds.length > 0) {
        const { data } = await supabase
          .from("projects")
          .select("id, name, requires_vehicle_check")
          .in("id", projectIds);

        projects = (data ?? []) as Project[];
      }

      // 今日すでに日報がある場合は、その案件を最優先
      const savedProjectId = reportResult.data?.project_id ?? null;

      const storageKey = projectSelectionKey(String(driverId), date);

      const storedProjectId =
        typeof window !== "undefined"
          ? Number(window.localStorage.getItem(storageKey)) || null
          : null;

      let selectedProjectId: number | null = null;

      if (
        savedProjectId &&
        projects.some((project) => project.id === savedProjectId)
      ) {
        selectedProjectId = savedProjectId;
      } else if (
        storedProjectId &&
        projects.some((project) => project.id === storedProjectId)
      ) {
        // 同じドライバー・同じ日付で保存した選択を復元
        selectedProjectId = storedProjectId;
      } else if (projects.length === 1) {
        // 担当案件が1件なら自動選択
        selectedProjectId = projects[0].id;
      }

      // 不正なIDや担当外案件のIDが保存されていた場合は削除
      if (
        storedProjectId &&
        !projects.some((project) => project.id === storedProjectId)
      ) {
        window.localStorage.removeItem(storageKey);
      }

      // 選択した案件を保存
      if (selectedProjectId !== null) {
        window.localStorage.setItem(storageKey, String(selectedProjectId));
        window.dispatchEvent(new Event("driver-session-updated"));
      }

      // 取得した情報を画面に反映
      setState({
        driverName: driverResult.data?.name ?? "",
        driverId: String(driverId),
        projects,
        selectedProjectId,
        reportProjectId: savedProjectId,
        check: !!checkResult.data,
        reportStatus,
        checkStatus,
        loading: false,
      });
    };

    void load();
  }, []);

  const selectedProject =
    state.projects.find((project) => project.id === state.selectedProjectId) ??
    null;

  const requiresCheck = selectedProject?.requires_vehicle_check ?? false;

  const reportDone =
    !!selectedProject && state.reportProjectId === selectedProject.id;

  const completedCount =
    Number(reportDone) + (requiresCheck ? Number(state.check) : 0);

  const requiredCount = selectedProject ? (requiresCheck ? 2 : 1) : 0;

  const isShein = selectedProject?.name === "SHEIN";
  const isCSOsakaTech = selectedProject?.name === "CS大阪テック";
  const canOpenReport =
    !!selectedProject &&
    (isShein || isCSOsakaTech || !requiresCheck || state.check || reportDone);
  const allRecordsSaved = reportDone && (!requiresCheck || state.check);

  const allRecordsSubmitted =
    state.reportStatus === "submitted" &&
    (!requiresCheck || state.checkStatus === "submitted");

  const reportUrl = selectedProject
    ? `/test/report/new?project_id=${selectedProject.id}`
    : "#";

  // 案件選択
  const selectProject = (id: number | null) => {
    if (!state.driverId || !today) return;

    const storageKey = projectSelectionKey(state.driverId, today);

    if (id === null) {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, String(id));
    }

    setState((current) => ({
      ...current,
      selectedProjectId: id,
    }));
    // 下部メニューに案件変更を通知
    window.dispatchEvent(new Event("report-project-updated"));
    window.dispatchEvent(new Event("driver-session-updated"));
  };

  return (
    <AuthGuard>
      <main className="min-h-screen px-4 pb-28 pt-24">
        <div className="mx-auto max-w-md space-y-5">
          {/* ヘッダー */}
          <section className="overflow-hidden rounded-xl border border-mist-200 bg-white p-5 text-mist-600 shadow-md shadow-mist-300">
            <p className="text-xs font-semibold tracking-wider text-teal-600">
              LSY DRIVER PORTAL
            </p>

            <h1 className="mt-2 text-2xl font-bold ">
              {state.driverName ? `${state.driverName} さん` : "お疲れさまです"}
            </h1>

            <p className="mt-1 text-sm text-mist-500">
              今日の案件を確認して、必要な記録を入力しましょう。
            </p>

            <div className="mt-5 rounded-lg bg-mist-100 p-4">
              <div className="flex items-center gap-2 text-sm text-mist-500">
                <CalendarDays size={16} />
                {today ? formatDate(today) : "本日"}
              </div>

              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-mist-500">今日の入力状況</p>

                  <p className="mt-1 text-2xl font-bold">
                    {state.loading
                      ? "確認中…"
                      : selectedProject
                        ? isShein || isCSOsakaTech
                          ? `${Number(reportDone)} / 1 完了`
                          : `${completedCount} / ${requiredCount} 完了`
                        : "案件を選択してください"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 案件選択 */}
          <section className="rounded-xl border border-mist-200 bg-white p-4 shadow-md shadow-mist-300">
            <h2 className="text-base font-bold text-mist-700">今日の案件</h2>

            {state.loading ? (
              <p className="mt-3 text-sm text-mist-500">
                案件を確認しています…
              </p>
            ) : state.projects.length === 0 ? (
              <p className="mt-3 text-sm text-amber-700">
                担当案件が登録されていません。管理者に確認してください。
              </p>
            ) : state.projects.length === 1 ? (
              <div className="mt-3 rounded-lg bg-mist-50 px-4 py-3 text-sm font-semibold text-mist-700">
                {state.projects[0].name}
              </div>
            ) : (
              <>
                <p className="mt-2 text-xs text-mist-500">
                  今日稼働する案件を選択してください。
                </p>

                <select
                  value={state.selectedProjectId ?? ""}
                  disabled={state.reportProjectId !== null}
                  onChange={(e) =>
                    selectProject(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="mt-3 h-12 w-full rounded-lg border border-teal-500 bg-teal-50 px-3 text-mist-700 outline-none focus:border-mist-500 focus:ring-2 focus:ring-mist-100 disabled:opacity-70"
                >
                  <option value="">案件を選択してください</option>

                  {state.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                {state.reportProjectId !== null && (
                  <p className="mt-2 text-xs text-mist-500">
                    今日の日報が保存済みのため、案件を変更できません。
                  </p>
                )}
              </>
            )}
          </section>

          {/* 今日の業務 */}
          <section className="space-y-3">
            <h2 className="px-1 text-base font-bold text-mist-700">
              今日の業務
            </h2>

            {!state.loading && selectedProject && (
              <>
                {/* 点検が必要な案件のみ表示 */}
                {requiresCheck && !isShein && !isCSOsakaTech && (
                  <Link
                    href={`/test/report/check?project_id=${selectedProject.id}`}
                    className="group flex items-center gap-4 rounded-xl border border-mist-200 bg-white p-4 shadow-md shadow-mist-300 transition hover:border-mist-300 hover:shadow-none"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mist-100 text-mist-700">
                      <ClipboardCheck size={24} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-mist-700">運行前点検</h3>
                        <FieldStatus status={state.checkStatus} />
                      </div>

                      <p className="mt-1 text-xs leading-5 text-mist-500">
                        運行前に点検項目と必要な写真を記録
                      </p>
                    </div>

                    <ArrowRight
                      size={19}
                      className="shrink-0 text-mist-400 transition group-hover:tranmist-x-0.5 group-hover:text-mist-600"
                    />
                  </Link>
                )}

                {/* 日報 */}
                {canOpenReport ? (
                  <Link
                    href={reportUrl}
                    className="group flex items-center gap-4 rounded-xl border border-mist-200 bg-white p-4 shadow-md shadow-mist-300 transition hover:border-mist-300 hover:shadow-none"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mist-100 text-mist-700">
                      <ClipboardPen size={24} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-mist-700">運行日報</h3>

                        <FieldStatus status={state.reportStatus} />
                      </div>

                      <p className="mt-1 text-xs leading-5 text-mist-500">
                        勤務・走行・配送実績を入力して保存
                      </p>
                    </div>

                    <ArrowRight
                      size={19}
                      className="shrink-0 text-mist-400 transition group-hover:tranmist-x-0.5 group-hover:text-mist-600"
                    />
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 rounded-xl border border-mist-200 bg-mist-100 p-4 opacity-70">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mist-200 text-mist-500">
                      <ClipboardPen size={24} />
                    </div>

                    <div>
                      <h3 className="font-bold text-mist-700">運行日報</h3>

                      <p className="mt-1 text-xs text-mist-500">
                        先に車両点検を完了してください
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {!state.loading && !selectedProject && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                今日の案件を選択すると、入力画面へ進めます。
              </div>
            )}
          </section>

          {/* 記録状況メッセージ */}
          {!state.loading && selectedProject && (
            <>
              {!allRecordsSaved && (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <AlertCircle className="mt-0.5 shrink-0" size={19} />
                  <div>
                    <p className="text-sm font-bold">未完了の記録があります</p>
                    <p className="mt-1 text-xs leading-5">
                      保存状況を確認し、入力が必要な項目を完了してください。
                    </p>
                  </div>
                </div>
              )}

              {allRecordsSaved && !allRecordsSubmitted && (
                <div className="flex gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-800">
                  <FileText className="mt-0.5 shrink-0" size={19} />
                  <div>
                    <p className="text-sm font-bold">日報が未提出です</p>
                    <p className="mt-1 text-xs leading-5">
                      記録が全て保存されました。
                      <br />
                      内容を確認して問題なければ管理者に提出してください。
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          {/* 履歴・PDF */}
          <section className="grid grid-cols-2 gap-3">
            <Link
              href={`/test/report/history?project_id=${selectedProject?.id ?? ""}`}
              className="rounded-xl border border-mist-200 bg-white p-4 shadow-md shadow-mist-300 transition hover:border-mist-300 hover:shadow-none"
            >
              <History className="text-mist-700" size={22} />

              <p className="mt-3 text-sm font-bold text-mist-700">業務履歴</p>

              <p className="mt-1 text-xs text-mist-500">
                過去の日報・記録を確認
              </p>
            </Link>

            <Link
              href={`/test/report/pdf?project_id=${selectedProject?.id ?? ""}`}
              className="rounded-xl border border-mist-200 bg-white p-4 shadow-md shadow-mist-300 transition hover:border-mist-300 hover:shadow-none"
            >
              <FileText className="text-mist-700" size={22} />

              <p className="mt-3 text-sm font-bold text-mist-700">
                PDFプレビュー
              </p>

              <p className="mt-1 text-xs text-mist-500">
                日報・点検の帳票を確認
              </p>
            </Link>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
