"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";
import CustomTimeSelect from "@/components/ui/CustomTimeSelect";
import { getDriverSessionId, setDriverSessionId } from "@/lib/driver-session";
import { findDriverIdForUser } from "@/lib/driver-auth";
import {
  deleteLocalDraft,
  getLocalDraft,
  saveLocalDraft,
} from "@/lib/local-drafts";
import { ClipboardPen, Package, Van, Clock } from "lucide-react";

export default function ReportNewPage() {
  const router = useRouter();
  const [driverId, setDriverId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryCount, setDeliveryCount] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [actualStartLocation, setActualStartLocation] = useState("");
  const [actualEndLocation, setActualEndLocation] = useState("");
  const [mainTransitPoints, setMainTransitPoints] = useState("");
  const [transitPoints, setTransitPoints] = useState<string[]>([""]);
  const [breakSleepRecords, setBreakSleepRecords] = useState("");
  const [driverChangeRecords, setDriverChangeRecords] = useState("");
  const [waitingRecords, setWaitingRecords] = useState("");
  const [cargoHandlingRecords, setCargoHandlingRecords] = useState("");
  const [incidentRecords, setIncidentRecords] = useState("");
  const [workStatus, setWorkStatus] = useState<"出勤" | "欠勤" | "">("");
  const [note, setNote] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [odometerStart, setOdometerStart] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");
  const [carryOutAm, setCarryOutAm] = useState("");
  const [carryOutPm, setCarryOutPm] = useState("");
  const [carryBackAm, setCarryBackAm] = useState("");
  const [carryBackPm, setCarryBackPm] = useState("");
  const [lastDeliveryAm, setLastDeliveryAm] = useState("");
  const [lastDeliveryPm, setLastDeliveryPm] = useState("");
  const [collectionCount, setCollectionCount] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveVersion, setSaveVersion] = useState(0);
  const lastSavedSnapshot = useRef<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [requiresVehicleCheck, setRequiresVehicleCheck] = useState(false);
  const [absenceReason, setAbsenceReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [driverError, setDriverError] = useState("");
  const [returnedDeliveryCount, setReturnedDeliveryCount] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [requestedProjectId, setRequestedProjectId] = useState<number | null>(
    null,
  );
  const [projectParamReady, setProjectParamReady] = useState(false);
  const [projectReady, setProjectReady] = useState(false);
  const [projectError, setProjectError] = useState("");
  const searchParams = useSearchParams();
  const reportId = Number(searchParams.get("id"));

  // -----------------------------
  // セッション取得
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
        return;
      }
      const savedDriverId = getDriverSessionId();
      if (!savedDriverId) {
        const { driverId } = await findDriverIdForUser({
          email: data.session.user.email,
          metadata: data.session.user.user_metadata,
        });
        if (driverId) {
          setDriverSessionId(driverId);
          setDriverId(driverId);
        }
      } else {
        setDriverId(Number(savedDriverId));
      }
      setLoading(false);
    };
    init();
  }, [router]);

  // URLから案件ID・日付を取得
  useEffect(() => {
    const projectValue = searchParams.get("project_id");
    const dateValue = searchParams.get("date");

    setRequestedProjectId(
      projectValue && /^\d+$/.test(projectValue) ? Number(projectValue) : null,
    );

    if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      setDate(dateValue);
    }

    setProjectParamReady(true);
  }, [searchParams]);
  // -----------------------------
  // ホーム画面で選択された案件を取得・検証
  // -----------------------------
  useEffect(() => {
    if (!driverId || !projectParamReady) return;

    const loadSelectedProject = async () => {
      setProjectReady(false);
      setProjectError("");

      let targetProjectId: number | null = null;

      // 編集の場合は保存済み日報の案件IDを使用
      if (reportId && Number.isFinite(reportId)) {
        // 既存の日報から取得するため、ここでは設定しない
      } else {
        // 新規入力の場合はホーム画面で選択した案件を優先
        const storageKey = `report-selected-project:${driverId}:${date}`;
        const storedProjectId = Number(window.localStorage.getItem(storageKey));

        targetProjectId =
          storedProjectId > 0 ? storedProjectId : requestedProjectId;
      }

      // 編集の場合は、保存済み日報から案件IDと日付を取得
      if (reportId && Number.isFinite(reportId)) {
        const { data: existingReport, error } = await supabase
          .from("daily_reports")
          .select("id, project_id, report_date")
          .eq("id", reportId)
          .eq("driver_id", driverId)
          .is("deleted_at", null)
          .maybeSingle();

        if (error || !existingReport) {
          setProjectError(
            error
              ? `日報の取得に失敗しました：${error.message}`
              : "編集する日報が見つかりません。",
          );
          setProjectReady(true);
          return;
        }

        targetProjectId = Number(existingReport.project_id);
        setDate(existingReport.report_date);
      }

      // 新規入力の場合だけ案件選択を必須にする
      if (!targetProjectId) {
        setProjectError(
          "ホーム画面で今日の案件を選択してから日報を開いてください。",
        );
        setProjectReady(true);
        return;
      }

      const { data: driverProjects, error: assignmentError } = await supabase
        .from("driver_projects")
        .select("project_id")
        .eq("driver_id", driverId);

      if (assignmentError) {
        setProjectError(
          `担当案件の確認に失敗しました：${assignmentError.message}`,
        );
        setProjectReady(true);
        return;
      }

      const isAssigned = (driverProjects ?? []).some(
        (item) => Number(item.project_id) === targetProjectId,
      );

      if (!isAssigned) {
        setProjectError(
          "選択された案件は担当案件に登録されていません。ホーム画面に戻って選択し直してください。",
        );
        setProjectReady(true);
        return;
      }

      const [{ data: driver }, { data: project, error: projectErrorResult }] =
        await Promise.all([
          supabase
            .from("drivers")
            .select("plate_number")
            .eq("id", driverId)
            .maybeSingle(),
          supabase
            .from("projects")
            .select(
              "id, name, current_unit_price, delivery_area, start_location, end_location, requires_vehicle_check",
            )
            .eq("id", targetProjectId)
            .maybeSingle(),
        ]);

      if (projectErrorResult || !project) {
        setProjectError(
          projectErrorResult
            ? `案件情報の取得に失敗しました：${projectErrorResult.message}`
            : "案件情報を取得できませんでした。",
        );
        setProjectReady(true);
        return;
      }

      setPlateNumber(driver?.plate_number ?? "");
      setProjectId(project.id);
      setProjectName(project.name);
      setRequiresVehicleCheck(Boolean(project.requires_vehicle_check));
      setUnitPrice(String(project.current_unit_price ?? ""));
      setDeliveryArea(project.delivery_area ?? "");
      setStartLocation(project.start_location ?? "");
      setEndLocation(project.end_location ?? "");
      setProjectReady(true);
    };

    void loadSelectedProject();
  }, [driverId, projectParamReady, requestedProjectId]);

  // -----------------------------
  // 日報読み込み
  // -----------------------------
  useEffect(() => {
    if (!driverId || !projectReady || !projectId) return;
    const loadTodayReport = async () => {
      setDraftReady(false);
      const restoreDraft = async () => {
        const key = `daily-report:${driverId}:${date}`;
        try {
          const draft = await getLocalDraft<Record<string, unknown>>(key);
          if (draft) {
            const setters: Record<string, (value: any) => void> = {
              deliveryCount: setDeliveryCount,
              actualStartLocation: setActualStartLocation,
              actualEndLocation: setActualEndLocation,
              mainTransitPoints: (value) => {
                setMainTransitPoints(String(value));
                setTransitPoints(
                  String(value)
                    .split(/[、,，\n]/)
                    .map((v) => v.trim())
                    .filter(Boolean).length
                    ? String(value)
                        .split(/[、,，\n]/)
                        .map((v) => v.trim())
                        .filter(Boolean)
                    : [""],
                );
              },
              breakSleepRecords: setBreakSleepRecords,
              driverChangeRecords: setDriverChangeRecords,
              waitingRecords: setWaitingRecords,
              cargoHandlingRecords: setCargoHandlingRecords,
              incidentRecords: setIncidentRecords,
              workStatus: setWorkStatus,
              note: setNote,
              startTime: setStartTime,
              endTime: setEndTime,
              breakStart: setBreakStart,
              breakEnd: setBreakEnd,
              plateNumber: setPlateNumber,
              odometerStart: setOdometerStart,
              odometerEnd: setOdometerEnd,
              carryOutAm: setCarryOutAm,
              carryOutPm: setCarryOutPm,
              carryBackAm: setCarryBackAm,
              carryBackPm: setCarryBackPm,
              lastDeliveryAm: setLastDeliveryAm,
              lastDeliveryPm: setLastDeliveryPm,
              collectionCount: setCollectionCount,
              absenceReason: setAbsenceReason,
              returnedDeliveryCount: setReturnedDeliveryCount,
            };
            for (const [field, setter] of Object.entries(setters)) {
              if (draft[field] !== undefined && draft[field] !== null)
                setter(draft[field]);
            }
          }
        } catch (error) {
          console.warn("日報の下書きを復元できませんでした", error);
        } finally {
          setDraftReady(true);
        }
      };

      let reportQuery = supabase
        .from("daily_reports")
        .select("*")
        .eq("driver_id", driverId)
        .is("deleted_at", null);

      if (reportId && Number.isFinite(reportId)) {
        reportQuery = reportQuery.eq("id", reportId);
      } else {
        reportQuery = reportQuery.eq("report_date", date);
      }

      const { data, error: reportLoadError } = await reportQuery.maybeSingle();

      if (reportLoadError) {
        console.error("日報の取得に失敗しました", reportLoadError);
        setProjectError(`日報の取得に失敗しました：${reportLoadError.message}`);
        setDraftReady(true);
        return;
      }

      if (!data) {
        setSavedReportId(null);
        setSubmittedAt(null);
        setDeliveryCount("");
        setReturnedDeliveryCount("");
        setWorkStatus("");
        setNote("");
        setAbsenceReason("");
        setStartTime("");
        setEndTime("");
        setBreakStart("");
        setBreakEnd("");
        setOdometerStart("");
        setOdometerEnd("");
        setCarryOutAm("");
        setCarryOutPm("");
        setCarryBackAm("");
        setCarryBackPm("");
        setLastDeliveryAm("");
        setLastDeliveryPm("");
        setCollectionCount("");
        setActualStartLocation("");
        setActualEndLocation("");
        setMainTransitPoints("");
        setBreakSleepRecords("");
        setDriverChangeRecords("該当なし");
        setWaitingRecords("該当なし");
        setCargoHandlingRecords("該当なし");
        setIncidentRecords("該当なし");
        console.log("日報なし", { driverId, date });
        await restoreDraft();
        return;
      }

      console.log("保存済み日報:", data);
      setSavedReportId(Number(data.id));
      setSubmittedAt(data.submitted_at ?? null);

      // ホーム画面で選択された案件を使用する。
      // 保存済み日報の案件IDが異なる場合は、既存日報を別案件で上書きしない。
      if (data.project_id && Number(data.project_id) !== projectId) {
        setProjectError(
          "保存済みの日報とホーム画面で選択した案件が異なります。ホーム画面に戻って確認してください。",
        );
        setDraftReady(true);
        return;
      }

      // -----------------------------
      // 日報データ復元
      // -----------------------------
      setDeliveryCount(data.delivery_count ?? "");
      setReturnedDeliveryCount(data.returned_delivery_count ?? "");
      setWorkStatus(data.work_status ?? "");
      setNote(data.note ?? "");
      setCollectionCount(String(data.collection_count ?? ""));
      setCarryOutAm(String(data.carry_out_am ?? ""));
      setCarryOutPm(String(data.carry_out_pm ?? ""));
      setCarryBackAm(String(data.carry_back_am ?? ""));
      setCarryBackPm(String(data.carry_back_pm ?? ""));
      setOdometerStart(String(data.odometer_start ?? ""));
      setOdometerEnd(String(data.odometer_end ?? ""));
      setLastDeliveryAm(data.last_delivery_am ?? "");
      setLastDeliveryPm(data.last_delivery_pm ?? "");
      setStartTime(data.start_time ?? "");
      setEndTime(data.end_time ?? "");
      setBreakStart(data.break_start ?? "");
      setBreakEnd(data.break_end ?? "");
      setAbsenceReason(data.absence_reason ?? "");
      setActualStartLocation(data.actual_start_location ?? "");
      setActualEndLocation(data.actual_end_location ?? "");
      setMainTransitPoints(data.main_transit_points ?? "");
      setTransitPoints(
        String(data.main_transit_points ?? "")
          .split(/[、,，\n]/)
          .map((v) => v.trim())
          .filter(Boolean).length
          ? String(data.main_transit_points ?? "")
              .split(/[、,，\n]/)
              .map((v) => v.trim())
              .filter(Boolean)
          : [""],
      );
      setBreakSleepRecords(data.break_sleep_records ?? "");
      setDriverChangeRecords(data.driver_change_records ?? "該当なし");
      setWaitingRecords(data.waiting_records ?? "該当なし");
      setCargoHandlingRecords(data.cargo_handling_records ?? "該当なし");
      setIncidentRecords(data.incident_records ?? "該当なし");
      if (data.submitted_at) {
        setDraftReady(true);
        return;
      }

      await restoreDraft();
    };

    loadTodayReport();
  }, [driverId, date, projectReady, projectId]);

  useEffect(() => {
    if (!driverId || !draftReady || !date || submittedAt) return;
    const key = `daily-report:${driverId}:${date}`;
    const draft = {
      projectId,
      projectName,
      unitPrice,
      deliveryCount,
      deliveryArea,
      startLocation,
      endLocation,
      actualStartLocation,
      actualEndLocation,
      mainTransitPoints,
      breakSleepRecords,
      driverChangeRecords,
      waitingRecords,
      cargoHandlingRecords,
      incidentRecords,
      workStatus,
      note,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      plateNumber,
      odometerStart,
      odometerEnd,
      carryOutAm,
      carryOutPm,
      carryBackAm,
      carryBackPm,
      lastDeliveryAm,
      lastDeliveryPm,
      collectionCount,
      absenceReason,
      returnedDeliveryCount,
    };
    void saveLocalDraft(key, draft).catch((error) =>
      console.warn("日報の下書きを保存できませんでした", error),
    );
  }, [
    driverId,
    draftReady,
    date,
    submittedAt,
    projectId,
    projectName,
    unitPrice,
    deliveryCount,
    deliveryArea,
    startLocation,
    endLocation,
    actualStartLocation,
    actualEndLocation,
    mainTransitPoints,
    breakSleepRecords,
    driverChangeRecords,
    waitingRecords,
    cargoHandlingRecords,
    incidentRecords,
    workStatus,
    note,
    startTime,
    endTime,
    breakStart,
    breakEnd,
    plateNumber,
    odometerStart,
    odometerEnd,
    carryOutAm,
    carryOutPm,
    carryBackAm,
    carryBackPm,
    lastDeliveryAm,
    lastDeliveryPm,
    collectionCount,
    absenceReason,
    returnedDeliveryCount,
  ]);

  // -----------------------------
  // 保存
  // -----------------------------

  const submit = async () => {
    if (submittedAt) {
      alert("提出済みの日報は編集できません。");
      return;
    }
    if (!driverId) return;
    if (!projectId) {
      alert("ホーム画面で案件を選択してください");
      return;
    }
    if (!workStatus) {
      alert("出勤区分を選択してください");
      return;
    }
    if (workStatus === "欠勤" && !absenceReason) {
      alert("欠勤理由を選択してください");
      return;
    }

    if (workStatus === "出勤") {
      if (!isShein && !plateNumber.trim()) {
        alert("車両ナンバーが未登録です。管理者に登録を依頼してください。");
        return;
      }
      if (!isShein && (odometerStart === "" || odometerEnd === "")) {
        alert("出庫メーターと帰庫メーターを入力してください。");
        return;
      }
      if (!isShein && Number(odometerEnd) < Number(odometerStart)) {
        alert("帰庫メーターは出庫メーター以上の値を入力してください。");
        return;
      }
      if (!isShein && (!startTime || !endTime)) {
        alert("業務開始時刻と業務終了時刻を入力してください。");
        return;
      }
      if ((breakStart || breakEnd) && !breakSleepRecords.trim()) {
        alert(
          "休憩時刻を入力した場合は、休憩した地点と日時も記録してください。",
        );
        return;
      }

      if (workStatus === "出勤" && deliveryCount === "") {
        alert("配達完了件数を入力してください");
        return;
      }
    }
    setSaving(true);

    const reportData = {
      driver_id: driverId,
      project_id: projectId,
      plate_number: plateNumber || null,
      report_date: date,
      delivery_count: Number(deliveryCount || 0),
      returned_delivery_count:
        workStatus === "欠勤" ? 0 : Number(returnedDeliveryCount || 0),
      delivery_area: workStatus === "欠勤" ? null : deliveryArea || null,
      unit_price: unitPrice === "" ? null : Number(unitPrice),
      work_status: workStatus,
      absence_reason: workStatus === "欠勤" ? absenceReason || null : null,
      start_time: workStatus === "欠勤" ? null : startTime || null,
      end_time: workStatus === "欠勤" ? null : endTime || null,
      start_location: workStatus === "欠勤" ? null : startLocation || null,
      end_location: workStatus === "欠勤" ? null : endLocation || null,
      actual_start_location:
        workStatus === "欠勤" ? null : actualStartLocation.trim() || null,
      actual_end_location:
        workStatus === "欠勤" ? null : actualEndLocation.trim() || null,
      main_transit_points:
        workStatus === "欠勤" ? null : mainTransitPoints.trim() || null,
      break_sleep_records:
        workStatus === "欠勤" ? null : breakSleepRecords.trim() || null,
      driver_change_records:
        workStatus === "欠勤" ? null : driverChangeRecords.trim() || null,
      waiting_records:
        workStatus === "欠勤" ? null : waitingRecords.trim() || null,
      cargo_handling_records:
        workStatus === "欠勤" ? null : cargoHandlingRecords.trim() || null,
      incident_records:
        workStatus === "欠勤" ? null : incidentRecords.trim() || null,
      break_start: workStatus === "欠勤" ? null : breakStart || null,
      break_end: workStatus === "欠勤" ? null : breakEnd || null,
      last_delivery_am: workStatus === "欠勤" ? null : lastDeliveryAm || null,
      last_delivery_pm: workStatus === "欠勤" ? null : lastDeliveryPm || null,
      odometer_start: workStatus === "欠勤" ? 0 : Number(odometerStart || 0),
      odometer_end: workStatus === "欠勤" ? 0 : Number(odometerEnd || 0),
      carry_out_am: workStatus === "欠勤" ? 0 : Number(carryOutAm || 0),
      carry_out_pm: workStatus === "欠勤" ? 0 : Number(carryOutPm || 0),
      carry_back_am: workStatus === "欠勤" ? 0 : Number(carryBackAm || 0),
      carry_back_pm: workStatus === "欠勤" ? 0 : Number(carryBackPm || 0),
      collection_count:
        workStatus === "欠勤" ? 0 : Number(collectionCount || 0),
      note,
    };
    setSaving(true);

    const { data: existing, error: checkError } = await supabase
      .from("daily_reports")
      .select("id, submitted_at")
      .eq("driver_id", driverId)
      .eq("report_date", date)
      .maybeSingle();

    if (checkError) {
      alert(checkError.message);
      setSaving(false);
      return;
    }

    if (existing?.submitted_at) {
      setSubmittedAt(existing.submitted_at);
      alert("この日報はすでに提出済みです。");
      setSaving(false);
      return;
    }

    Object.entries(reportData).forEach(([key, value]) => {
      console.log(key, value, typeof value);
    });
    if (existing) {
      const { error } = await supabase
        .from("daily_reports")
        .update(reportData)
        .eq("id", existing.id);

      if (error) {
        console.log(error);
        alert(JSON.stringify(error, null, 2));
        setSaving(false);
        return;
      }

      // 更新した日報のIDを保持
      setSavedReportId(Number(existing.id));
      setSaveVersion((v) => v + 1);

      alert("日報を更新しました");
      console.log("日報更新成功", reportData);
    } else {
      const { data: inserted, error } = await supabase
        .from("daily_reports")
        .insert([reportData])
        .select("id")
        .single();

      if (error) {
        alert(error.message);
        setSaving(false);
        return;
      }

      setSavedReportId(Number(inserted.id));
      setSaveVersion((v) => v + 1);

      alert("日報を保存しました");
      console.log("日報更新成功", reportData);
    }

    try {
      await deleteLocalDraft(`daily-report:${driverId}:${date}`);
    } catch (error) {
      console.warn("日報下書きの削除に失敗しました", error);
    }
    setSaving(false);
  };
  const submitToAdmin = async () => {
    if (!savedReportId || !driverId) {
      alert("先に日報を保存してください。");
      return;
    }

    if (submittedAt) {
      alert("この日報はすでに提出済みです。");
      return;
    }

    // 車両点検が必要な案件は、点検データの保存を確認
    if (requiresVehicleCheck) {
      const { data: check, error: checkError } = await supabase
        .from("driver_vehicle_checks")
        .select("id")
        .eq("driver_id", driverId)
        .eq("check_date", date)
        .maybeSingle();

      if (checkError) {
        alert(`車両点検データの確認に失敗しました：${checkError.message}`);
        return;
      }

      if (!check) {
        alert("車両点検がまだ保存されていません。点検画面で保存してください。");
        return;
      }
    }

    const confirmed = window.confirm(
      "日報を管理者に提出しますか？\n提出後は編集できなくなります。",
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const { error } = await supabase.rpc("submit_daily_report", {
        p_report_id: savedReportId,
      });

      if (error) {
        alert(`提出に失敗しました：${error.message}`);
        return;
      }

      setSubmittedAt(new Date().toISOString());

      try {
        await deleteLocalDraft(`daily-report:${driverId}:${date}`);
      } catch (error) {
        console.warn("日報下書きの削除に失敗しました", error);
      }

      alert("管理者に日報を提出しました。");
    } finally {
      setSaving(false);
    }
  };
  const sales = Number(deliveryCount || 0) * Number(unitPrice || 0);
  const distance = Math.max(
    Number(odometerEnd || 0) - Number(odometerStart || 0),
    0,
  );
  const isShein = projectName === "SHEIN";
  const isCSOSakaTech = projectName === "CS大阪テック";

  const canSubmitReport =
    !!savedReportId &&
    !!driverId &&
    !!projectId &&
    !!workStatus &&
    (workStatus !== "欠勤" || !!absenceReason) &&
    (workStatus !== "出勤" ||
      ((isShein || !!plateNumber.trim()) &&
        (isShein || (odometerStart !== "" && odometerEnd !== "")) &&
        (isShein || Number(odometerEnd) >= Number(odometerStart)) &&
        (isShein || (!!startTime && !!endTime)) &&
        (!(breakStart || breakEnd) || !!breakSleepRecords.trim()) &&
        deliveryCount !== "")) &&
    !submittedAt &&
    !hasUnsavedChanges;
  useEffect(() => {
    if (!draftReady || !savedReportId || submittedAt) return;

    const currentSnapshot = JSON.stringify([
      projectId,
      plateNumber,
      deliveryCount,
      returnedDeliveryCount,
      deliveryArea,
      workStatus,
      absenceReason,
      startTime,
      endTime,
      startLocation,
      endLocation,
      actualStartLocation,
      actualEndLocation,
      mainTransitPoints,
      breakSleepRecords,
      driverChangeRecords,
      waitingRecords,
      cargoHandlingRecords,
      incidentRecords,
      breakStart,
      breakEnd,
      lastDeliveryAm,
      lastDeliveryPm,
      odometerStart,
      odometerEnd,
      carryOutAm,
      carryOutPm,
      carryBackAm,
      carryBackPm,
      collectionCount,
      note,
    ]);

    if (lastSavedSnapshot.current === null || saveVersion > 0) {
      lastSavedSnapshot.current = currentSnapshot;
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(currentSnapshot !== lastSavedSnapshot.current);
  }, [
    draftReady,
    savedReportId,
    submittedAt,
    projectId,
    plateNumber,
    deliveryCount,
    returnedDeliveryCount,
    deliveryArea,
    workStatus,
    absenceReason,
    startTime,
    endTime,
    startLocation,
    endLocation,
    actualStartLocation,
    actualEndLocation,
    mainTransitPoints,
    breakSleepRecords,
    driverChangeRecords,
    waitingRecords,
    cargoHandlingRecords,
    incidentRecords,
    breakStart,
    breakEnd,
    lastDeliveryAm,
    lastDeliveryPm,
    odometerStart,
    odometerEnd,
    carryOutAm,
    carryOutPm,
    carryBackAm,
    carryBackPm,
    collectionCount,
    note,
    saveVersion,
  ]);

  if (loading || (driverId !== null && !projectReady)) {
    return (
      <main className="p-4 max-w-md mx-auto">
        <p className="text-xs text-mist-400">読み込み中...</p>
      </main>
    );
  }

  if (!driverId) {
    return (
      <main className="p-4 max-w-md mx-auto">
        <div className="rounded-lg bg-white p-4 shadow space-y-3">
          <PageTitle>日報入力</PageTitle>
          <p className="text-sm text-mist-600">
            ドライバー情報を取得できませんでした。
          </p>
          {driverError && (
            <p className="text-sm text-red-500 whitespace-pre-wrap">
              {driverError}
            </p>
          )}
          <Button onClick={() => router.push("/login")}>ログインへ戻る</Button>
        </div>
      </main>
    );
  }
  if (submittedAt) {
    return (
      <main className="min-h-screen px-4 pt-24">
        <div className="mx-auto max-w-md rounded-lg border border-mist-200 bg-white p-5 shadow-md">
          <PageTitle>運行日報</PageTitle>

          <div className="mt-5 rounded-lg bg-teal-50 p-4">
            <p className="font-bold text-teal-700">
              管理者への提出が完了しています
            </p>
            <p className="mt-2 text-sm text-mist-600">
              この日報は提出済みのため、編集できません。
            </p>
          </div>

          <div className="mt-4 space-y-2 text-sm text-mist-600">
            <p>対象日：{date}</p>
            <p>案件：{projectName}</p>
            <p>
              提出日時：
              {new Date(submittedAt).toLocaleString("ja-JP")}
            </p>
          </div>

          <div className="mt-5">
            <Button
              className="w-full"
              onClick={() => router.push("/test/report")}
            >
              ホーム画面に戻る
            </Button>
          </div>
        </div>
      </main>
    );
  }
  if (projectError) {
    return (
      <main className="mx-auto max-w-md p-4 pt-24">
        <div className="space-y-3 rounded-lg bg-white p-4 shadow">
          <PageTitle>日報入力</PageTitle>
          <p className="text-sm text-red-600">{projectError}</p>
          <Button onClick={() => router.push("/test/report")}>
            ホーム画面に戻る
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pt-24 pb-36">
      <div className="mx-auto max-w-md space-y-5">
        <header className="gap-3 rounded-lg bg-white border border-mist-200 shadow-md shadow-mist-300">
          <div className="rounded-t-lg flex items-center gap-3 bg-mist-100 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white text-sky-800">
              <ClipboardPen size={24} />
            </div>
            <div className="min-w-0">
              <PageTitle>運行日報</PageTitle>
              <p className="mt-0.5 text-xs leading-5 text-mist-500">
                勤務・走行・配送実績を入力して保存
              </p>
            </div>
          </div>
          <div className="w-full min-w-0 max-w-full p-4">
            <label className="block text-sm font-bold text-mist-500">
              対象日
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="block w-full max-w-full min-w-0 box-border appearance-none rounded-md border border-mist-200 bg-mist-50 px-3 py-3 text-base text-mist-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <div className="flex gap-4 mt-3">
              <div className="basis-1/2">
                <label className="mb-1 text-sm font-bold text-mist-500">
                  案件
                </label>
                <p className="rounded-md bg-mist-100 px-4 py-3 text-base text-mist-600">
                  {projectName}
                </p>
              </div>
              <div className="basis-1/2">
                <label className="mb-1 text-sm font-bold text-mist-500">
                  車両ナンバー
                </label>
                <p className="rounded-md bg-mist-100 px-4 py-3 text-base text-mist-600">
                  {plateNumber || "未登録"}
                </p>
              </div>
            </div>
          </div>
        </header>
        {/* 入力カード */}
        <Card>
          <FormSection icon={<ClipboardPen size={24} />} title="出勤区分" />

          {/* 出勤区分 */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-mist-700"></label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setWorkStatus("出勤");
                  setAbsenceReason("");
                }}
                className={`p-3 rounded-lg h-14 border border-teal-500 text-teal-500 font-bold ${
                  workStatus === "出勤"
                    ? "bg-teal-500 text-white border-teal-500 font-bold"
                    : "bg-white"
                }`}
              >
                出勤
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkStatus("欠勤");
                  setDeliveryCount("");
                }}
                className={`p-3 rounded-lg h-14 border border-teal-500 text-teal-500 font-bold ${
                  workStatus === "欠勤"
                    ? "bg-teal-500 text-white border-teal-500 font-bold"
                    : "bg-white"
                }`}
              >
                欠勤
              </button>
            </div>
          </div>
          {workStatus === "欠勤" && (
            <div>
              <label className="block text-sm text-mist-500 mb-1">
                欠勤理由（任意）
              </label>

              <select
                value={absenceReason}
                onChange={(e) => setAbsenceReason(e.target.value)}
                className="border border-mist-200 rounded-xl w-full h-12 px-4 bg-mist-50 text-mist-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">選択してください</option>
                <option value="体調不良">体調不良</option>
                <option value="家庭都合">家庭都合</option>
                <option value="車両故障">車両故障</option>
                <option value="その他">その他</option>
              </select>
            </div>
          )}
        </Card>
        {workStatus !== "欠勤" && !isShein && (
          <>
            {/* 走行情報 */}
            <Card>
              <div className="space-y-3">
                <FormSection icon={<Van size={24} />} title="走行情報" />
                <div>
                  <label className="block text-sm font-bold text-mist-500 mb-1">
                    配送エリア
                  </label>
                  <div className="rounded-lg text-mist-500 bg-mist-100 px-4 py-3 flex items-center">
                    {deliveryArea}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-mist-500 mb-1">
                      出発場所
                    </label>
                    <div className="rounded-lg text-mist-500 bg-mist-100 px-4 py-3 flex items-center">
                      {startLocation}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-mist-500 mb-1">
                      帰着場所
                    </label>
                    <div className="rounded-lg text-mist-500 bg-mist-100 px-4 py-3 flex items-center">
                      {endLocation}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="出庫メーター"
                  type="number"
                  value={odometerStart}
                  suffix="km"
                  onChange={(e) => setOdometerStart(e.target.value)}
                />

                <Input
                  label="帰庫メーター"
                  type="number"
                  value={odometerEnd}
                  suffix="km"
                  onChange={(e) => setOdometerEnd(e.target.value)}
                />
              </div>
              <div className="bg-mist-100 rounded-lg p-3 flex justify-between">
                <span className="text-mist-500">走行距離</span>
                <span className="font-bold text-mist-700">
                  {distance.toLocaleString()} km
                </span>
              </div>
            </Card>
          </>
        )}
        {workStatus !== "欠勤" && !isShein && (
          <Card>
            <FormSection icon={<Clock size={24} />} title="勤務時間" />
            <CustomTimeSelect
              label="業務開始時間"
              value={startTime}
              onChange={setStartTime}
            />
            <div className="grid grid-cols-2 gap-3">
              <CustomTimeSelect
                label="休憩開始"
                value={breakStart}
                onChange={setBreakStart}
              />
              <CustomTimeSelect
                label="休憩終了"
                value={breakEnd}
                onChange={setBreakEnd}
              />
            </div>
            <CustomTimeSelect
              label="業務終了時刻"
              value={endTime}
              onChange={setEndTime}
            />
          </Card>
        )}

        {workStatus !== "欠勤" && !isShein && (
          <Card>
            <FormSection icon={<Clock size={24} />} title="法定運行記録" />
            <p className="mb-5 text-xs text-mist-500">
              集荷・納品した場所を運行の実態に合わせて記録してください。
            </p>
            <div className="space-y-5">
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-bold text-mist-500">
                  主な経過地点
                </label>

                <div className="space-y-2">
                  {transitPoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                        {index + 1}
                      </span>

                      <input
                        required={index === 0}
                        value={point}
                        onChange={(e) => {
                          const next = [...transitPoints];
                          next[index] = e.target.value;
                          setTransitPoints(next);
                          setMainTransitPoints(
                            next
                              .map((v) => v.trim())
                              .filter(Boolean)
                              .join("、"),
                          );
                        }}
                        placeholder={`経過地点 ${index + 1}`}
                        className="h-12 min-w-0 flex-1 rounded-lg border-1 border-teal-500 bg-teal-50 px-3 text-mist-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      />

                      {transitPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = transitPoints.filter(
                              (_, i) => i !== index,
                            );
                            setTransitPoints(next);
                            setMainTransitPoints(
                              next
                                .map((v) => v.trim())
                                .filter(Boolean)
                                .join("、"),
                            );
                          }}
                          aria-label="経過地点を削除"
                          className="rounded-xl border border-mist-200 bg-white p-3 text-mist-500"
                        >
                          <span aria-hidden="true">−</span>
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setTransitPoints([...transitPoints, ""])}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-dashed border-mist-400 bg-mist-50 font-semibold text-mist-500 aspect-square cursor-pointer items-center justify-center overflow-hidden border border-dashed border-mist-300"
                  >
                    <span className="text-xl leading-none">＋</span>
                    経過地点を追加
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-bold text-mist-500">
                  休憩の地点（複数ある場合はすべて記入）
                </label>
                <textarea
                  value={breakSleepRecords}
                  onChange={(e) => setBreakSleepRecords(e.target.value)}
                  rows={3}
                  placeholder={
                    "例：休憩 12:00〜12:30／〇〇駐車場\n睡眠 〇月〇日 〇時〜〇時／場所"
                  }
                  className="w-full rounded-lg rounded-lg border border-teal-500 bg-teal-50 px-3 py-2 text-mist-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
          </Card>
        )}

        {workStatus !== "欠勤" && !isShein && (
          <Card>
            <FormSection
              icon={<Clock size={24} />}
              title="待機・荷役・附帯業務の記録"
              required={false}
            />
            <p className="mb-3 text-xs text-mist-500">
              該当する業務があった場合に記録してください。待機が30分以上の場合は、地点・到着日時・積込/取卸開始終了・附帯業務開始終了・出発日時を記録します。
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-mist-500 mb-1">
                  荷主都合による30分以上の待機
                </label>
                <textarea
                  value={waitingRecords}
                  onChange={(e) => setWaitingRecords(e.target.value)}
                  rows={3}
                  placeholder={
                    "地点／指定到着日時（指定がある場合）／実際の到着日時／積込・取卸開始終了／附帯業務開始終了／出発日時"
                  }
                  className="w-full rounded-lg border border-mist-200 bg-mist-50 px-3 py-2 text-mist-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-sm text-mist-500 mb-1">
                  荷役作業・附帯業務
                </label>
                <textarea
                  value={cargoHandlingRecords}
                  onChange={(e) => setCargoHandlingRecords(e.target.value)}
                  rows={3}
                  placeholder="地点／作業内容（積込・取卸・仕分け等）／開始日時／終了日時／荷主確認の有無"
                  className="w-full rounded-lg border border-mist-200 bg-mist-50 px-3 py-2 text-mist-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-sm text-mist-500 mb-1">
                  事故・異常・著しい遅延など
                </label>
                <textarea
                  value={incidentRecords}
                  onChange={(e) => setIncidentRecords(e.target.value)}
                  rows={2}
                  placeholder="発生日時／場所／概要／原因／対応・再発防止策（該当時）"
                  className="w-full rounded-lg border border-mist-200 bg-mist-50 px-3 py-2 text-mist-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
          </Card>
        )}
        {workStatus !== "欠勤" && (
          <>
            <Card>
              {/* 配送数 */}
              <FormSection
                icon={<Package size={24} />}
                title="配送実績"
                required={false}
              />
              <Input
                required
                label="配達完了件数"
                type="number"
                value={deliveryCount}
                suffix="件"
                onChange={(e) => setDeliveryCount(e.target.value)}
              />
              {!isShein && (
                <>
                  {!isCSOSakaTech && (
                    <Input
                      label="不在持ち帰り件数"
                      type="number"
                      value={returnedDeliveryCount}
                      suffix="件"
                      onChange={(e) => setReturnedDeliveryCount(e.target.value)}
                      className="!border-mist-200 !bg-mist-50 focus:!border-teal-500 focus:!ring-2 focus:!ring-teal-100"
                    />
                  )}
                  <Input
                    label="伝票枚数"
                    type="number"
                    value={carryOutAm}
                    suffix="枚"
                    onChange={(e) => setCarryOutAm(e.target.value)}
                    className="!border-mist-200 !bg-mist-50 focus:!border-teal-500 focus:!ring-2 focus:!ring-teal-100"
                  />
                </>
              )}
            </Card>
          </>
        )}

        {!isShein && (
          <Card>
            {/* 備考 */}
            <div>
              <label className="block text-sm text-mist-500 mb-1">備考</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-mist-200 bg-mist-50 px-3 py-2 text-mist-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="自由記入"
              />
            </div>
          </Card>
        )}

        <div className="fixed mx-auto max-w-md bottom-16 left-0 right-0 z-40 border-t border-mist-200 bg-white p-4">
          <div className="mx-auto max-w-md">
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={submit}
                disabled={saving || Boolean(submittedAt)}
              >
                {saving ? "保存中..." : "保存する"}
              </Button>

              <Button
                className="flex-1"
                onClick={submitToAdmin}
                disabled={saving || !canSubmitReport}
              >
                {saving ? "処理中..." : "管理者に提出する"}
              </Button>
            </div>

            {!submittedAt && !canSubmitReport && (
              <p className="mt-2 text-center text-xs text-slate-500">
                日報を保存すると、管理者に提出できるようになります。
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
