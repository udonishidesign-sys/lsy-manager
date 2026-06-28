"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import PageTitle from "@/components/ui/PageTitle";
import { getDriverSessionId, clearDriverSession } from "@/lib/driver-session";
import {
  ClipboardPen,
  Package,
  Van,
  FileText,
  Clock,
  CircleCheckBig,
  ChevronDown,
} from "lucide-react";

type Project = {
  id: number;
  name: string;
  current_unit_price: number;
};

export default function ReportNewPage() {
  const router = useRouter();
  const [driverId, setDriverId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [workStatus, setWorkStatus] = useState<"出勤" | "欠勤" | "">("");
  const [note, setNote] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [odometerStart, setOdometerStart] = useState(0);
  const [odometerEnd, setOdometerEnd] = useState(0);
  const [carryOutAm, setCarryOutAm] = useState(0);
  const [carryOutPm, setCarryOutPm] = useState(0);
  const [carryBackAm, setCarryBackAm] = useState(0);
  const [carryBackPm, setCarryBackPm] = useState(0);
  const [lastDeliveryAm, setLastDeliveryAm] = useState("");
  const [lastDeliveryPm, setLastDeliveryPm] = useState("");
  const [collectionCount, setCollectionCount] = useState(0);
  const [checkBrake, setCheckBrake] = useState(false);
  const [checkTire, setCheckTire] = useState(false);
  const [checkLight, setCheckLight] = useState(false);
  const [checkWiper, setCheckWiper] = useState(false);
  const [checkDriveRecorder, setCheckDriveRecorder] = useState(false);
  const [saving, setSaving] = useState(false);
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
  const selectedProject = projects.find((p) => p.id === projectId);
  const unitPrice = selectedProject?.current_unit_price ?? 0;
  const sales = deliveryCount * unitPrice;
  const [vehicleCheck, setVehicleCheck] = useState(false);
  const params = useParams();
  const reportId = Number(params.id);
  const [absenceReason, setAbsenceReason] = useState("");
  const distance = Math.max(odometerEnd - odometerStart, 0);

  // -----------------------------
  // 初期ロード
  // -----------------------------
  useEffect(() => {
    const fetchData = async () => {
      const { data: driverData } = await supabase
        .from("drivers")
        .select("id,name")
        .order("id");

      const { data: projectData } = await supabase
        .from("projects")
        .select("id,name,current_unit_price")
        .order("id");

      setProjects(projectData ?? []);
    };

    fetchData();
  }, []);

  // -----------------------------
  // ドライバー情報取得（案件自動設定）
  // -----------------------------
  useEffect(() => {
    if (!driverId) return;
    const loadDriver = async () => {
      const { data: driver } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", driverId)
        .single();
      if (!driver) return;
      const { data: project } = await supabase
        .from("projects")
        .select("id,name,current_unit_price")
        .eq("id", driver.project_id)
        .single();
      if (!project) return;
      setProjectId(project.id);
      setProjectName(project.name);
    };
    loadDriver();
  }, [driverId]);

  // -----------------------------
  // セッション復元
  // -----------------------------
  useEffect(() => {
    const id = getDriverSessionId();

    if (!id) {
      router.push("/login");
      return;
    }
    setDriverId(id);
  }, [router]);

  useEffect(() => {
    if (!reportId) return;

    const loadReport = async () => {
      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (!data) return;
      setProjectId(data.project_id);
      setDate(data.report_date);
      setDeliveryCount(data.delivery_count ?? 0);
      setCollectionCount(data.collection_count ?? 0);
      setWorkStatus(data.work_status ?? "");
      setNote(data.note ?? "");
      setStartTime(data.start_time ?? "");
      setEndTime(data.end_time ?? "");
      setBreakStart(data.break_start ?? "");
      setBreakEnd(data.break_end ?? "");
      setOdometerStart(data.odometer_start ?? 0);
      setOdometerEnd(data.odometer_end ?? 0);
      setCarryOutAm(data.carry_out_am ?? 0);
      setCarryOutPm(data.carry_out_pm ?? 0);
      setCarryBackAm(data.carry_back_am ?? 0);
      setCarryBackPm(data.carry_back_pm ?? 0);
      setLastDeliveryAm(data.last_delivery_am ?? "");
      setLastDeliveryPm(data.last_delivery_pm ?? "");
      setCollectionCount(data.collection_count ?? 0);
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
    };

    loadReport();
  }, [reportId]);

  // -----------------------------
  // ドライバー切替
  // -----------------------------
  const switchDriver = () => {
    clearDriverSession();
    router.push("/login");
  };

  // -----------------------------
  // 保存
  // -----------------------------
  const submit = async () => {
    if (!driverId) return;

    if (!workStatus) {
      alert("出勤区分を選択してください");
      return;
    }

    if (workStatus === "欠勤" && !absenceReason) {
      alert("欠勤理由を選択してください");
      return;
    }

    setSaving(true);

    const reportData = {
      driver_id: driverId,
      project_id: projectId,
      report_date: date,
      delivery_count: workStatus === "欠勤" ? 0 : deliveryCount,
      unit_price: unitPrice,
      work_status: workStatus,
      absence_reason: workStatus === "欠勤" ? absenceReason || null : null,
      start_time: workStatus === "欠勤" ? null : startTime || null,
      end_time: workStatus === "欠勤" ? null : endTime || null,
      break_start: workStatus === "欠勤" ? null : breakStart || null,
      break_end: workStatus === "欠勤" ? null : breakEnd || null,
      last_delivery_am: workStatus === "欠勤" ? null : lastDeliveryAm || null,
      last_delivery_pm: workStatus === "欠勤" ? null : lastDeliveryPm || null,
      odometer_start: workStatus === "欠勤" ? 0 : odometerStart,
      odometer_end: workStatus === "欠勤" ? 0 : odometerEnd,
      carry_out_am: workStatus === "欠勤" ? 0 : carryOutAm,
      carry_out_pm: workStatus === "欠勤" ? 0 : carryOutPm,
      carry_back_am: workStatus === "欠勤" ? 0 : carryBackAm,
      carry_back_pm: workStatus === "欠勤" ? 0 : carryBackPm,
      collection_count: workStatus === "欠勤" ? 0 : collectionCount,
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
    };

    const { data: existing, error: checkError } = await supabase
      .from("daily_reports")
      .select("id")
      .eq("driver_id", driverId)
      .eq("report_date", date)
      .maybeSingle();

    if (checkError) {
      alert(checkError.message);
      setSaving(false);
      return;
    }

    if (existing) {
      const { error } = await supabase
        .from("daily_reports")
        .update(reportData)
        .eq("id", existing.id);

      if (error) {
        alert(error.message);
        setSaving(false);
        return;
      }

      alert("日報を更新しました");
    } else {
      const { error } = await supabase
        .from("daily_reports")
        .insert([reportData]);

      if (error) {
        alert(error.message);
        setSaving(false);
        return;
      }

      alert("日報を保存しました");
    }

    setSaving(false);
  };

  if (!driverId) {
    return (
      <main className="p-4">
        <p>ログイン情報がありません</p>
      </main>
    );
  }

  return (
    <main className="px-4 pt-6 pb-40">
      <div className="max-w-md mx-auto space-y-4">
        {/* 入力カード */}
        <div className="space-y-4">
          <PageTitle>日報入力</PageTitle>
          <Card>
            <FormSection icon={<ClipboardPen size={24} />} title="勤務情報" />
            <div>
              <label className="block text-sm text-gray-500 mb-1">案件</label>
              <div className="rounded-lg text-gray-500 bg-slate-100 px-4 py-3 flex items-center">
                {projectName}
              </div>
            </div>

            {/* 日付 */}
            <Input
              label="日付"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            {/* 出勤区分 */}
            <div>
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
                    setDeliveryCount(0);
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
            {workStatus !== "欠勤" && (
              <>
                {/* 勤務時間 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="出庫時間"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <Input
                      label="帰庫時間"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="休憩開始"
                      type="time"
                      value={breakStart}
                      onChange={(e) => setBreakStart(e.target.value)}
                    />
                    <Input
                      label="休憩終了"
                      type="time"
                      value={breakEnd}
                      onChange={(e) => setBreakEnd(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </Card>
          {workStatus !== "欠勤" && (
            <>
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

              <Card>
                {/* 走行情報 */}
                <div className="space-y-3">
                  <FormSection icon={<Van size={24} />} title="走行情報" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="出庫メーター"
                      type="number"
                      value={odometerStart}
                      suffix="km"
                      onChange={(e) => setOdometerStart(Number(e.target.value))}
                    />
                    <Input
                      label="帰庫メーター"
                      type="number"
                      value={odometerEnd}
                      suffix="km"
                      onChange={(e) => setOdometerEnd(Number(e.target.value))}
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

              <Card>
                <FormSection icon={<FileText size={24} />} title="伝票管理" />
                <span className="text-slate-500 font-semibold">
                  出発前持出伝票
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="AM便"
                    type="number"
                    value={carryOutAm}
                    suffix="枚"
                    onChange={(e) => setCarryOutAm(Number(e.target.value))}
                  />
                  <Input
                    label="PM便"
                    type="number"
                    value={carryOutPm}
                    suffix="枚"
                    onChange={(e) => setCarryOutPm(Number(e.target.value))}
                  />
                </div>
                <span className="text-slate-500 font-semibold">
                  帰庫時持帰り伝票
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="AM便"
                    type="number"
                    value={carryBackAm}
                    suffix="枚"
                    onChange={(e) => setCarryBackAm(Number(e.target.value))}
                  />
                  <Input
                    label="PM便"
                    type="number"
                    value={carryBackPm}
                    suffix="枚"
                    onChange={(e) => setCarryBackPm(Number(e.target.value))}
                  />
                </div>
              </Card>

              <Card>
                <FormSection icon={<Clock size={24} />} title="配達完了時間" />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="AM便"
                    type="time"
                    value={lastDeliveryAm}
                    onChange={(e) => setLastDeliveryAm(e.target.value)}
                  />
                  <Input
                    label="PM便"
                    type="time"
                    value={lastDeliveryPm}
                    onChange={(e) => setLastDeliveryPm(e.target.value)}
                  />
                </div>
              </Card>

              <Card>
                {/* 配送数 */}
                <div>
                  <FormSection icon={<Package size={24} />} title="配送実績" />
                  <Input
                    label="配達完了件数"
                    type="number"
                    value={deliveryCount}
                    suffix="件"
                    onChange={(e) => setDeliveryCount(Number(e.target.value))}
                  />
                </div>

                {/* 売上 */}
                <div className="bg-slate-100 rounded-lg p-3">
                  <div className="flex justify-between text-slate-700">
                    <span>単価</span>
                    <span>¥{unitPrice.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between font-semibold mt-2 text-slate-700">
                    <span>売上</span>
                    <span>¥{sales.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </>
          )}

          <Card>
            {/* 備考 */}
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

        <div className="max-w-md mx-auto fixed bottom-16 left-0 right-0 bg-teal-50/80 p-4 z-50">
          <Button
            className="w-full"
            onClick={() => {
              console.log("ボタン押下");
              submit();
            }}
            disabled={saving}
          >
            {saving ? "更新中..." : "更新"}
          </Button>
        </div>
      </div>
    </main>
  );
}
