"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import PageTitle from "@/components/ui/PageTitle";
import PageActions from "@/components/ui/PageActions";
import CustomTimeSelect from "@/components/ui/CustomTimeSelect";

import { getDriverSessionId, setDriverSessionId } from "@/lib/driver-session";

import { findDriverIdForUser } from "@/lib/driver-auth";

import {
  ClipboardPen,
  Package,
  Van,
  Clock,
  CircleCheckBig,
  ChevronDown,
  Eye,
} from "lucide-react";

/* =========================================================
 * 型
 * ========================================================= */

type Project = {
  id: number;
  name: string;
  current_unit_price: number;
  delivery_area: string | null;
  start_location: string | null;
  end_location: string | null;
};

/* =========================================================
 * 今日の日付
 *
 * toISOString() はUTC基準になるため、
 * 日本時間では日付がずれる可能性があります。
 * ========================================================= */

const getTodayDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================================================
 * ReportNewPage
 * ========================================================= */

export default function ReportNewPage() {
  const router = useRouter();

  /* -------------------------------------------------------
   * ドライバー・案件
   * ------------------------------------------------------- */

  const [driverId, setDriverId] = useState<number | null>(null);

  const [projectId, setProjectId] = useState<number | null>(null);

  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

  const [projectName, setProjectName] = useState("");

  const [unitPrice, setUnitPrice] = useState("");

  /* -------------------------------------------------------
   * 基本情報
   * ------------------------------------------------------- */

  const [date, setDate] = useState(getTodayDate());

  const [deliveryCount, setDeliveryCount] = useState("");

  const [deliveryArea, setDeliveryArea] = useState("");

  const [startLocation, setStartLocation] = useState("");

  const [endLocation, setEndLocation] = useState("");

  const [workStatus, setWorkStatus] = useState<"出勤" | "欠勤" | "">("");

  const [absenceReason, setAbsenceReason] = useState("");

  const [note, setNote] = useState("");

  /* -------------------------------------------------------
   * 勤務時間
   * ------------------------------------------------------- */

  const [startTime, setStartTime] = useState("");

  const [endTime, setEndTime] = useState("");

  const [breakStart, setBreakStart] = useState("");

  const [breakEnd, setBreakEnd] = useState("");

  /* -------------------------------------------------------
   * 車両
   * ------------------------------------------------------- */

  const [plateNumber, setPlateNumber] = useState("");

  const [odometerStart, setOdometerStart] = useState("");

  const [odometerEnd, setOdometerEnd] = useState("");

  /* -------------------------------------------------------
   * 配送関連
   * ------------------------------------------------------- */

  const [carryOutAm, setCarryOutAm] = useState("");

  const [carryOutPm, setCarryOutPm] = useState("");

  const [carryBackAm, setCarryBackAm] = useState("");

  const [carryBackPm, setCarryBackPm] = useState("");

  const [lastDeliveryAm, setLastDeliveryAm] = useState("");

  const [lastDeliveryPm, setLastDeliveryPm] = useState("");

  const [collectionCount, setCollectionCount] = useState("");

  const [returnedDeliveryCount, setReturnedDeliveryCount] = useState("");

  /* -------------------------------------------------------
   * 運行前点検
   * ------------------------------------------------------- */

  const [checkBrake, setCheckBrake] = useState(false);

  const [checkTire, setCheckTire] = useState(false);

  const [checkLight, setCheckLight] = useState(false);

  const [checkWiper, setCheckWiper] = useState(false);

  const [checkDriveRecorder, setCheckDriveRecorder] = useState(false);

  const [checkEngine, setCheckEngine] = useState(false);

  const [checkHandle, setCheckHandle] = useState(false);

  const [checkHorn, setCheckHorn] = useState(false);

  const [checkTurnSignal, setCheckTurnSignal] = useState(false);

  const [checkBattery, setCheckBattery] = useState(false);

  const [checkEmergencySignal, setCheckEmergencySignal] = useState(false);

  const [checkFuel, setCheckFuel] = useState(false);

  const [checkCoolant, setCheckCoolant] = useState(false);

  const [checkOil, setCheckOil] = useState(false);

  const [checkLicensePlate, setCheckLicensePlate] = useState(false);

  const [checkVehicleInspection, setCheckVehicleInspection] = useState(false);

  const [checkInsurance, setCheckInsurance] = useState(false);

  /* -------------------------------------------------------
   * アルコールチェック
   * ------------------------------------------------------- */

  const [alcoholCheckTime, setAlcoholCheckTime] = useState("");

  const [alcoholCheckFile, setAlcoholCheckFile] = useState<File | null>(null);

  const [alcoholCheckImageUrl, setAlcoholCheckImageUrl] = useState("");

  /* -------------------------------------------------------
   * 状態
   * ------------------------------------------------------- */

  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);

  const [driverError, setDriverError] = useState("");

  /* =========================================================
   * 下書き保存用
   * ========================================================= */

  /*
   * localStorageに保存するデータ。
   *
   * Fileオブジェクトは保存できないため、
   * alcoholCheckFileだけは対象外。
   */

  const saveDraft = () => {
    if (!driverId) return;

    const draft = {
      projectId,
      projectName,
      unitPrice,

      date,

      deliveryCount,
      deliveryArea,

      startLocation,
      endLocation,

      workStatus,
      absenceReason,
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
      returnedDeliveryCount,

      checkBrake,
      checkTire,
      checkLight,
      checkWiper,
      checkDriveRecorder,
      checkEngine,
      checkHandle,
      checkHorn,
      checkTurnSignal,
      checkBattery,
      checkEmergencySignal,
      checkFuel,
      checkCoolant,
      checkOil,
      checkLicensePlate,
      checkVehicleInspection,
      checkInsurance,

      alcoholCheckTime,
      alcoholCheckImageUrl,
    };

    const key = `daily-report-draft-${driverId}-${date}`;

    localStorage.setItem(key, JSON.stringify(draft));
  };

  /* =========================================================
   * 下書き復元
   * ========================================================= */

  const loadDraft = (currentDriverId: number, currentDate: string) => {
    const key = `daily-report-draft-${currentDriverId}-${currentDate}`;

    const saved = localStorage.getItem(key);

    if (!saved) {
      return false;
    }

    try {
      const draft = JSON.parse(saved);

      setProjectId(draft.projectId ?? null);
      setProjectName(draft.projectName ?? "");
      setUnitPrice(draft.unitPrice ?? "");

      setDeliveryCount(draft.deliveryCount ?? "");
      setDeliveryArea(draft.deliveryArea ?? "");

      setStartLocation(draft.startLocation ?? "");
      setEndLocation(draft.endLocation ?? "");

      setWorkStatus(draft.workStatus ?? "");
      setAbsenceReason(draft.absenceReason ?? "");
      setNote(draft.note ?? "");

      setStartTime(draft.startTime ?? "");
      setEndTime(draft.endTime ?? "");
      setBreakStart(draft.breakStart ?? "");
      setBreakEnd(draft.breakEnd ?? "");

      setPlateNumber(draft.plateNumber ?? "");

      setOdometerStart(draft.odometerStart ?? "");
      setOdometerEnd(draft.odometerEnd ?? "");

      setCarryOutAm(draft.carryOutAm ?? "");
      setCarryOutPm(draft.carryOutPm ?? "");

      setCarryBackAm(draft.carryBackAm ?? "");
      setCarryBackPm(draft.carryBackPm ?? "");

      setLastDeliveryAm(draft.lastDeliveryAm ?? "");
      setLastDeliveryPm(draft.lastDeliveryPm ?? "");

      setCollectionCount(draft.collectionCount ?? "");
      setReturnedDeliveryCount(draft.returnedDeliveryCount ?? "");

      setCheckBrake(draft.checkBrake ?? false);
      setCheckTire(draft.checkTire ?? false);
      setCheckLight(draft.checkLight ?? false);
      setCheckWiper(draft.checkWiper ?? false);
      setCheckDriveRecorder(draft.checkDriveRecorder ?? false);

      setCheckEngine(draft.checkEngine ?? false);
      setCheckHandle(draft.checkHandle ?? false);
      setCheckHorn(draft.checkHorn ?? false);
      setCheckTurnSignal(draft.checkTurnSignal ?? false);
      setCheckBattery(draft.checkBattery ?? false);
      setCheckEmergencySignal(draft.checkEmergencySignal ?? false);

      setCheckFuel(draft.checkFuel ?? false);
      setCheckCoolant(draft.checkCoolant ?? false);
      setCheckOil(draft.checkOil ?? false);

      setCheckLicensePlate(draft.checkLicensePlate ?? false);

      setCheckVehicleInspection(draft.checkVehicleInspection ?? false);

      setCheckInsurance(draft.checkInsurance ?? false);

      setAlcoholCheckTime(draft.alcoholCheckTime ?? "");

      setAlcoholCheckImageUrl(draft.alcoholCheckImageUrl ?? "");

      return true;
    } catch (error) {
      console.error("下書きの復元に失敗しました", error);

      return false;
    }
  };

  /* =========================================================
   * 下書き削除
   * ========================================================= */

  const removeDraft = () => {
    if (!driverId) return;

    const key = `daily-report-draft-${driverId}-${date}`;

    localStorage.removeItem(key);
  };

  /* =========================================================
   * セッション取得
   * ========================================================= */

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
        const { driverId: foundDriverId } = await findDriverIdForUser({
          email: data.session.user.email,
          metadata: data.session.user.user_metadata,
        });

        if (foundDriverId) {
          setDriverSessionId(foundDriverId);
          setDriverId(foundDriverId);
        } else {
          setDriverError(
            "ログインしているユーザーに対応するドライバー情報が見つかりませんでした。",
          );
        }
      } else {
        setDriverId(Number(savedDriverId));
      }

      setLoading(false);
    };

    init();
  }, [router]);

  /* =========================================================
   * ドライバー情報・案件取得
   * ========================================================= */

  useEffect(() => {
    if (!driverId) return;

    const loadDriver = async () => {
      const { data: driver } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", driverId)
        .single();

      if (!driver) return;

      const { data: driverProjects } = await supabase
        .from("driver_projects")
        .select("project_id")
        .eq("driver_id", driverId);

      if (!driverProjects || driverProjects.length === 0) {
        setPlateNumber(driver.plate_number ?? "");
        return;
      }

      const projectIds = driverProjects.map((item) => item.project_id);

      const { data: projects } = await supabase
        .from("projects")
        .select(
          `
              id,
              name,
              current_unit_price,
              delivery_area,
              start_location,
              end_location
            `,
        )
        .in("id", projectIds);

      if (!projects) return;

      setAvailableProjects(projects);

      setPlateNumber(driver.plate_number ?? "");

      /*
       * 案件が1件だけなら自動設定。
       *
       * ただし下書きが存在する場合は、
       * 後から下書き側で上書きされる。
       */

      if (projects.length === 1) {
        const project = projects[0];

        setProjectId(project.id);
        setProjectName(project.name);

        setUnitPrice(String(project.current_unit_price));

        setDeliveryArea(project.delivery_area ?? "");

        setStartLocation(project.start_location ?? "");

        setEndLocation(project.end_location ?? "");
      }
    };

    loadDriver();
  }, [driverId]);

  /* =========================================================
   * 日報読み込み
   *
   * 優先順位
   *
   * ① Supabaseに保存済みの日報
   * ② localStorageの下書き
   * ========================================================= */

  useEffect(() => {
    if (!driverId) return;

    const loadTodayReport = async () => {
      /*
       * まずlocalStorageの下書きがあるか確認
       */
      const draftKey = `daily-report-draft-${driverId}-${date}`;

      const hasDraft = localStorage.getItem(draftKey);

      /*
       * Supabaseから保存済み日報を取得
       */

      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("driver_id", driverId)
        .eq("report_date", date)
        .is("deleted_at", null)
        .maybeSingle();

      /*
       * SupabaseにもlocalStorageにもない
       */

      if (!data && !hasDraft) {
        console.log("日報・下書きなし", {
          driverId,
          date,
        });

        return;
      }

      /*
       * Supabaseに日報がある場合
       */

      if (data) {
        console.log("保存済み日報:", data);

        if (data.project_id) {
          const { data: proj } = await supabase
            .from("projects")
            .select(
              `
                  id,
                  name,
                  current_unit_price,
                  delivery_area,
                  start_location,
                  end_location
                `,
            )
            .eq("id", data.project_id)
            .single();

          if (proj) {
            setProjectId(proj.id);
            setProjectName(proj.name);

            setUnitPrice(String(proj.current_unit_price));

            setDeliveryArea(proj.delivery_area ?? "");

            setStartLocation(proj.start_location ?? "");

            setEndLocation(proj.end_location ?? "");
          }
        }

        /*
         * 日報データ復元
         */

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

        /*
         * 運行前点検
         */

        setCheckBrake(data.check_brake ?? false);

        setCheckTire(data.check_tire ?? false);

        setCheckLight(data.check_light ?? false);

        setCheckWiper(data.check_wiper ?? false);

        setCheckDriveRecorder(data.check_drive_recorder ?? false);

        setCheckEngine(data.check_engine ?? false);

        setCheckHandle(data.check_handle ?? false);

        setCheckHorn(data.check_horn ?? false);

        setCheckTurnSignal(data.check_turn_signal ?? false);

        setCheckBattery(data.check_battery ?? false);

        setCheckEmergencySignal(data.check_emergency_signal ?? false);

        setCheckFuel(data.check_fuel ?? false);

        setCheckCoolant(data.check_coolant ?? false);

        setCheckOil(data.check_oil ?? false);

        setCheckLicensePlate(data.check_license_plate ?? false);

        setCheckVehicleInspection(data.check_vehicle_inspection ?? false);

        setCheckInsurance(data.check_insurance ?? false);

        setAbsenceReason(data.absence_reason ?? "");

        setAlcoholCheckTime(data.alcohol_check_time ?? "");

        setAlcoholCheckImageUrl(data.alcohol_check_image_url ?? "");
      }

      /*
       * ---------------------------------------------------
       * localStorageの下書きがあれば最後に復元
       *
       * これによって
       * 「保存済みの日報 + その後に入力途中だった内容」
       * を維持できます。
       * ---------------------------------------------------
       */

      if (hasDraft) {
        console.log("入力途中の下書きを復元します");

        loadDraft(driverId, date);
      }
    };

    loadTodayReport();
  }, [driverId, date]);

  /* =========================================================
   * 入力変更時に自動で下書き保存
   *
   * 画面遷移・リロード対策
   * ========================================================= */

  useEffect(() => {
    if (!driverId) return;

    /*
     * 初期読み込み直後に大量の初期値を
     * 上書き保存しないよう少し待つ。
     */

    const timer = window.setTimeout(() => {
      saveDraft();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    driverId,

    date,

    projectId,
    projectName,
    unitPrice,

    deliveryCount,
    deliveryArea,

    startLocation,
    endLocation,

    workStatus,
    absenceReason,
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
    returnedDeliveryCount,

    checkBrake,
    checkTire,
    checkLight,
    checkWiper,
    checkDriveRecorder,
    checkEngine,
    checkHandle,
    checkHorn,
    checkTurnSignal,
    checkBattery,
    checkEmergencySignal,
    checkFuel,
    checkCoolant,
    checkOil,
    checkLicensePlate,
    checkVehicleInspection,
    checkInsurance,

    alcoholCheckTime,
    alcoholCheckImageUrl,
  ]);

  /* =========================================================
   * 案件変更
   * ========================================================= */

  const changeProject = (id: number) => {
    const project = availableProjects.find((item) => item.id === id);

    if (!project) return;

    setProjectId(project.id);

    setProjectName(project.name);

    setUnitPrice(String(project.current_unit_price));

    setDeliveryArea(project.delivery_area ?? "");

    setStartLocation(project.start_location ?? "");

    setEndLocation(project.end_location ?? "");
  };

  /* =========================================================
   * 保存
   * ========================================================= */

  const submit = async () => {
    if (!driverId) return;

    if (!projectId) {
      alert("案件を選択してください");
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

    const uploadAlcoholCheckImage = async () => {
      if (!alcoholCheckFile || !driverId) {
        return alcoholCheckImageUrl || null;
      }

      const fileExt = alcoholCheckFile.name.split(".").pop() || "jpg";

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const filePath = `alcohol-checks/${driverId}/${date}/${fileName}`;

      const { error } = await supabase.storage
        .from("report-files")
        .upload(filePath, alcoholCheckFile);

      if (error) throw error;

      const { data } = supabase.storage
        .from("report-files")
        .getPublicUrl(filePath);

      return data.publicUrl;
    };

    setSaving(true);

    let uploadedAlcoholImageUrl = alcoholCheckImageUrl || null;

    try {
      uploadedAlcoholImageUrl = await uploadAlcoholCheckImage();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "アルコールチェック写真のアップロードに失敗しました",
      );

      setSaving(false);
      return;
    }

    const reportData = {
      driver_id: driverId,

      project_id: projectId,

      plate_number: plateNumber || null,

      report_date: date,

      delivery_count: Number(deliveryCount || 0),

      returned_delivery_count:
        workStatus === "欠勤" ? 0 : Number(returnedDeliveryCount || 0),

      delivery_area: workStatus === "欠勤" ? null : deliveryArea || null,

      unit_price: unitPrice,

      work_status: workStatus,

      absence_reason: workStatus === "欠勤" ? absenceReason || null : null,

      start_time: workStatus === "欠勤" ? null : startTime || null,

      end_time: workStatus === "欠勤" ? null : endTime || null,

      start_location: workStatus === "欠勤" ? null : startLocation || null,

      end_location: workStatus === "欠勤" ? null : endLocation || null,

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

      check_brake: workStatus === "欠勤" ? false : checkBrake,

      check_tire: workStatus === "欠勤" ? false : checkTire,

      check_light: workStatus === "欠勤" ? false : checkLight,

      check_wiper: workStatus === "欠勤" ? false : checkWiper,

      check_drive_recorder: workStatus === "欠勤" ? false : checkDriveRecorder,

      check_engine: workStatus === "欠勤" ? false : checkEngine,

      check_handle: workStatus === "欠勤" ? false : checkHandle,

      check_horn: workStatus === "欠勤" ? false : checkHorn,

      check_turn_signal: workStatus === "欠勤" ? false : checkTurnSignal,

      check_battery: workStatus === "欠勤" ? false : checkBattery,

      check_emergency_signal:
        workStatus === "欠勤" ? false : checkEmergencySignal,

      check_fuel: workStatus === "欠勤" ? false : checkFuel,

      check_coolant: workStatus === "欠勤" ? false : checkCoolant,

      check_oil: workStatus === "欠勤" ? false : checkOil,

      check_license_plate: workStatus === "欠勤" ? false : checkLicensePlate,

      check_vehicle_inspection:
        workStatus === "欠勤" ? false : checkVehicleInspection,

      check_insurance: workStatus === "欠勤" ? false : checkInsurance,

      note,

      alcohol_check_time:
        workStatus === "欠勤" ? null : alcoholCheckTime || null,

      alcohol_check_image_url:
        workStatus === "欠勤" ? null : uploadedAlcoholImageUrl,
    };

    try {
      const { data: existing, error: checkError } = await supabase
        .from("daily_reports")
        .select("id")
        .eq("driver_id", driverId)
        .eq("report_date", date)
        .is("deleted_at", null)
        .maybeSingle();

      if (checkError) {
        alert(checkError.message);
        setSaving(false);
        return;
      }

      console.log("reportData", reportData);

      if (existing) {
        const { error } = await supabase
          .from("daily_reports")
          .update(reportData)
          .eq("id", existing.id);

        if (error) {
          console.error(error);

          alert(JSON.stringify(error, null, 2));

          setSaving(false);
          return;
        }

        /*
         * Supabase更新成功
         */
        removeDraft();

        alert("日報を更新しました");
      } else {
        const { error } = await supabase
          .from("daily_reports")
          .insert([reportData]);

        if (error) {
          console.error(error);

          alert(error.message);

          setSaving(false);
          return;
        }

        /*
         * Supabase新規保存成功
         */
        removeDraft();

        alert("日報を保存しました");
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error ? error.message : "日報の保存に失敗しました",
      );

      setSaving(false);
      return;
    }

    setSaving(false);
  };

  /* =========================================================
   * 計算
   * ========================================================= */

  const sales = Number(deliveryCount || 0) * Number(unitPrice || 0);

  const distance = Math.max(
    Number(odometerEnd || 0) - Number(odometerStart || 0),
    0,
  );

  const isShein = projectName === "SHEIN";

  /* =========================================================
   * ロード中
   * ========================================================= */

  if (loading) {
    return (
      <main className="p-4 max-w-md mx-auto">
        <p className="text-xs text-gray-400">読み込み中...</p>
      </main>
    );
  }

  /* =========================================================
   * ドライバー情報なし
   * ========================================================= */

  if (!driverId) {
    return (
      <main className="p-4 max-w-md mx-auto">
        <div className="rounded-lg bg-white p-4 shadow space-y-3">
          <PageTitle>日報入力</PageTitle>

          <p className="text-sm text-gray-600">
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

  /* =========================================================
   * UI
   * ========================================================= */

  return (
    <main className="px-4 pt-24 pb-40">
      <div className="max-w-md mx-auto space-y-4">
        {/* 入力カード */}

        <div className="space-y-4">
          <PageTitle>日報入力</PageTitle>

          {/* =========================================
           * 勤務情報
           * ========================================= */}

          <Card>
            <FormSection icon={<ClipboardPen size={24} />} title="勤務情報" />

            {/* 案件 */}

            <div>
              <label className="block text-sm text-gray-500 mb-1">案件</label>

              {availableProjects.length > 1 ? (
                <select
                  value={projectId ?? ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);

                    if (!id) {
                      setProjectId(null);

                      setProjectName("");

                      setUnitPrice("");

                      setDeliveryArea("");

                      setStartLocation("");

                      setEndLocation("");

                      return;
                    }

                    changeProject(id);
                  }}
                  className="text-gray-700 px-3 py-3 w-full h-12 rounded-lg border border-teal-500 bg-teal-50 leading-12 outline-none"
                >
                  <option value="">選択してください</option>

                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-lg text-gray-500 bg-slate-100 px-4 py-3 flex items-center">
                  {projectName}
                </div>
              )}
            </div>

            {/* 車両ナンバー */}

            <div className="mt-3">
              <label className="block text-sm text-gray-500 mb-1">
                車両ナンバー
              </label>

              <div className="rounded-lg text-gray-500 bg-slate-100 px-4 py-3 flex items-center">
                {plateNumber || "未登録"}
              </div>
            </div>

            {/* 日付 */}

            <div className="mt-3">
              <Input
                label="日付"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* 出勤区分 */}

            <div className="mt-3">
              <label className="block text-sm text-gray-500 mb-1">
                出勤区分
              </label>

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

            {/* 欠勤理由 */}

            {workStatus === "欠勤" && (
              <div className="mt-3">
                <label className="block text-sm text-gray-500 mb-1">
                  欠勤理由（任意）
                </label>

                <select
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="border rounded-lg w-full h-12 px-4 bg-teal-50 border-teal-500 text-slate-700 outline-none"
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

          {/* =========================================
           * 出勤時のみ表示
           * ========================================= */}

          {workStatus !== "欠勤" && (
            <>
              {/* =====================================
               * アルコールチェック
               * ===================================== */}

              <Card>
                <div className="space-y-3">
                  <FormSection
                    icon={<ClipboardPen size={24} />}
                    title="アルコールチェック"
                  />

                  <CustomTimeSelect
                    label="チェック時間"
                    value={alcoholCheckTime}
                    onChange={setAlcoholCheckTime}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    {/* 撮影 */}

                    <label className="flex items-center justify-center h-12 rounded-lg bg-teal-500 text-white font-bold cursor-pointer">
                      撮影する
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) =>
                          setAlcoholCheckFile(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>

                    {/* 選択 */}

                    <label className="flex items-center justify-center h-12 rounded-lg border border-teal-500 text-teal-600 font-bold bg-white cursor-pointer">
                      選択する
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setAlcoholCheckFile(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  </div>

                  {/* 新しく選択したファイル */}

                  {alcoholCheckFile && (
                    <div className="flex justify-between items-center">
                      <p className="mt-2 text-sm text-teal-600 truncate">
                        {alcoholCheckFile.name}
                      </p>

                      {alcoholCheckImageUrl && (
                        <PageActions
                          actions={[
                            {
                              type: "detail",
                              href: alcoholCheckImageUrl,
                              target: "_blank",
                              label: "",
                              icon: <Eye size={20} />,
                            },
                          ]}
                        />
                      )}
                    </div>
                  )}

                  {/* 既に保存されている写真 */}

                  {!alcoholCheckFile && alcoholCheckImageUrl && (
                    <a
                      href={alcoholCheckImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm text-teal-600 underline"
                    >
                      登録済み写真を見る
                    </a>
                  )}
                </div>
              </Card>

              {/* =====================================
               * 運行前点検
               * ===================================== */}

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
                    <Checkbox
                      label="ブレーキ"
                      checked={checkBrake}
                      onChange={setCheckBrake}
                    />

                    <Checkbox
                      label="原動機"
                      checked={checkEngine}
                      onChange={setCheckEngine}
                    />

                    <Checkbox
                      label="ハンドル"
                      checked={checkHandle}
                      onChange={setCheckHandle}
                    />

                    <Checkbox
                      label="タイヤ"
                      checked={checkTire}
                      onChange={setCheckTire}
                    />

                    <Checkbox
                      label="ワイパー"
                      checked={checkWiper}
                      onChange={setCheckWiper}
                    />

                    <Checkbox
                      label="クラクション"
                      checked={checkHorn}
                      onChange={setCheckHorn}
                    />

                    <Checkbox
                      label="ウィンカー"
                      checked={checkTurnSignal}
                      onChange={setCheckTurnSignal}
                    />

                    <Checkbox
                      label="バッテリー"
                      checked={checkBattery}
                      onChange={setCheckBattery}
                    />

                    <Checkbox
                      label="灯火装置"
                      checked={checkLight}
                      onChange={setCheckLight}
                    />

                    <Checkbox
                      label="非常用信号"
                      checked={checkEmergencySignal}
                      onChange={setCheckEmergencySignal}
                    />

                    <Checkbox
                      label="燃料"
                      checked={checkFuel}
                      onChange={setCheckFuel}
                    />

                    <Checkbox
                      label="冷却水"
                      checked={checkCoolant}
                      onChange={setCheckCoolant}
                    />

                    <Checkbox
                      label="オイル"
                      checked={checkOil}
                      onChange={setCheckOil}
                    />

                    <Checkbox
                      label="登録番号表"
                      checked={checkLicensePlate}
                      onChange={setCheckLicensePlate}
                    />

                    <Checkbox
                      label="検査証"
                      checked={checkVehicleInspection}
                      onChange={setCheckVehicleInspection}
                    />

                    <Checkbox
                      label="保険証"
                      checked={checkInsurance}
                      onChange={setCheckInsurance}
                    />

                    <Checkbox
                      label="ドラレコ動作確認"
                      checked={checkDriveRecorder}
                      onChange={setCheckDriveRecorder}
                    />
                  </div>
                </details>
              </Card>

              {/* =====================================
               * 走行情報
               * ===================================== */}

              <Card>
                <div className="space-y-3">
                  <FormSection icon={<Van size={24} />} title="走行情報" />

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      配送エリア
                    </label>

                    <div className="rounded-lg text-gray-500 bg-slate-100 px-4 py-3 flex items-center">
                      {deliveryArea}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        出発場所
                      </label>

                      <div className="rounded-lg text-gray-500 bg-slate-100 px-4 py-3 flex items-center">
                        {startLocation}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        帰着場所
                      </label>

                      <div className="rounded-lg text-gray-500 bg-slate-100 px-4 py-3 flex items-center">
                        {endLocation}
                      </div>
                    </div>

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
                </div>

                <div className="bg-slate-100 rounded-lg p-3 flex justify-between">
                  <span className="text-slate-500">走行距離</span>

                  <span className="font-bold text-slate-700">
                    {distance.toLocaleString()} km
                  </span>
                </div>
              </Card>

              {/* =====================================
               * 勤務時間
               * ===================================== */}

              <Card>
                <FormSection icon={<Clock size={24} />} title="勤務時間" />

                <div className="space-y-3">
                  <CustomTimeSelect
                    label="業務開始時間"
                    value={startTime}
                    onChange={setStartTime}
                  />

                  <div className="grid grid-cols-2 gap-4">
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
                    label="業務終了時間"
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>
              </Card>

              {/* =====================================
               * 配送実績
               * ===================================== */}

              <Card>
                <FormSection icon={<Package size={24} />} title="配送実績" />

                <Input
                  label="配達完了件数"
                  type="number"
                  value={deliveryCount}
                  suffix="件"
                  onChange={(e) => setDeliveryCount(e.target.value)}
                />

                <div className="bg-slate-100 rounded-lg p-3">
                  <div className="flex justify-between text-slate-700">
                    <span>単価</span>

                    <span>¥{Number(unitPrice || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between font-semibold mt-2 text-slate-700">
                    <span>売上</span>

                    <span>¥{sales.toLocaleString()}</span>
                  </div>
                </div>

                {isShein && (
                  <Input
                    label="不在持ち帰り件数"
                    type="number"
                    value={returnedDeliveryCount}
                    suffix="件"
                    onChange={(e) => setReturnedDeliveryCount(e.target.value)}
                  />
                )}

                <Input
                  label="伝票枚数"
                  type="number"
                  value={carryOutAm}
                  suffix="枚"
                  onChange={(e) => setCarryOutAm(e.target.value)}
                />
              </Card>
            </>
          )}

          {/* =========================================
           * 備考
           * ========================================= */}

          <Card>
            <div>
              <label className="block text-sm text-gray-500 mb-1">備考</label>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="border rounded-lg w-full py-3 px-2 bg-teal-50 border-teal-500 text-slate-700 outline-none"
                placeholder="自由記入"
              />
            </div>
          </Card>
        </div>

        {/* =========================================
         * 保存ボタン
         * ========================================= */}

        <div className="max-w-md mx-auto fixed bottom-16 left-0 right-0 bg-teal-50/80 p-4 z-50">
          <Button
            className="w-full"
            onClick={() => {
              console.log("保存ボタン押下");

              submit();
            }}
            disabled={saving}
          >
            {saving ? "保存中..." : "保存する"}
          </Button>
        </div>
      </div>
    </main>
  );
}
