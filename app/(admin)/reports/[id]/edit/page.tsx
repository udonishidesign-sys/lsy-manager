"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import PageTitle from "@/components/ui/PageTitle";
import FormSection from "@/components/ui/FormSection";
import StatusBadge from "@/components/ui/StatusBadge";
import PageActions from "@/components/ui/PageActions";
import {
  ClipboardPen,
  Package,
  Van,
  FileText,
  Clock,
  CircleCheckBig,
  CalendarCheck,
  Pen,
} from "lucide-react";

type WorkStatus = "出勤" | "欠勤" | "";

export default function ReportEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [driverName, setDriverName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

  const [reportDate, setReportDate] = useState("");
  const [workStatus, setWorkStatus] = useState<WorkStatus>("");
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [deliveryArea, setDeliveryArea] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [note, setNote] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
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
  const [eiajAm, setEiajAm] = useState(0);
  const [eiajPm, setEiajPm] = useState(0);
  const [collectionAm, setCollectionAm] = useState(0);
  const [collectionPm, setCollectionPm] = useState(0);

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

  const sales = deliveryCount * unitPrice;
  const distance = Math.max(odometerEnd - odometerStart, 0);
  const isShein = projectName === "SHEIN";

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        console.error(error);
        alert("日報が見つかりません");
        router.push("/reports");
        return;
      }

      setReportDate(data.report_date ?? "");
      setWorkStatus(data.work_status ?? "");
      setDeliveryCount(data.delivery_count ?? 0);
      setDeliveryArea(data.delivery_area ?? "");
      setUnitPrice(data.unit_price ?? 0);
      setNote(data.note ?? "");

      setStartTime(formatTimeValue(data.start_time));
      setEndTime(formatTimeValue(data.end_time));
      setStartLocation(data.start_location ?? "");
      setEndLocation(data.end_location ?? "");
      setBreakStart(formatTimeValue(data.break_start));
      setBreakEnd(formatTimeValue(data.break_end));

      setOdometerStart(data.odometer_start ?? 0);
      setOdometerEnd(data.odometer_end ?? 0);

      setCarryOutAm(data.carry_out_am ?? 0);
      setCarryOutPm(data.carry_out_pm ?? 0);
      setCarryBackAm(data.carry_back_am ?? 0);
      setCarryBackPm(data.carry_back_pm ?? 0);

      setLastDeliveryAm(formatTimeValue(data.last_delivery_am));
      setLastDeliveryPm(formatTimeValue(data.last_delivery_pm));

      setCollectionCount(data.collection_count ?? 0);
      setEiajAm(data.eiaj_am ?? 0);
      setEiajPm(data.eiaj_pm ?? 0);
      setCollectionAm(data.collection_am ?? 0);
      setCollectionPm(data.collection_pm ?? 0);

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

      const { data: driver } = await supabase
        .from("drivers")
        .select("name,vehicle_number")
        .eq("id", data.driver_id)
        .single();

      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", data.project_id)
        .single();

      setDriverName(driver?.name ?? "不明");
      setPlateNumber(driver?.vehicle_number ?? "");
      setProjectName(project?.name ?? "不明");
      setLoading(false);
    };

    fetchReport();
  }, [id, router]);

  const submit = async () => {
    if (!workStatus) {
      alert("出勤区分を選択してください");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("daily_reports")
      .update({
        report_date: reportDate,
        driver_name: driverName,
        delivery_count: deliveryCount,
        plate_number: plateNumber || null,
        delivery_area: deliveryArea || null,
        unit_price: unitPrice,
        work_status: workStatus,
        start_time: startTime || null,
        end_time: endTime || null,
        start_location: startLocation || null,
        end_location: endLocation || null,
        break_start: breakStart || null,
        break_end: breakEnd || null,
        odometer_start: odometerStart,
        odometer_end: odometerEnd,
        carry_out_am: carryOutAm,
        carry_out_pm: carryOutPm,
        carry_back_am: carryBackAm,
        carry_back_pm: carryBackPm,
        last_delivery_am: lastDeliveryAm || null,
        last_delivery_pm: lastDeliveryPm || null,
        eiaj_am: eiajAm,
        eiaj_pm: eiajPm,
        collection_am: collectionAm,
        collection_pm: collectionPm,
        collection_count: collectionCount,
        check_brake: checkBrake,
        check_tire: checkTire,
        check_light: checkLight,
        check_wiper: checkWiper,
        check_drive_recorder: checkDriveRecorder,
        check_engine: checkEngine,
        check_handle: checkHandle,
        check_horn: checkHorn,
        check_turn_signal: checkTurnSignal,
        check_battery: checkBattery,
        check_emergency_signal: checkEmergencySignal,
        check_fuel: checkFuel,
        check_coolant: checkCoolant,
        check_oil: checkOil,
        check_license_plate: checkLicensePlate,
        check_vehicle_inspection: checkVehicleInspection,
        check_insurance: checkInsurance,
        note,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("日報を更新しました");
    router.push(`/reports/${id}`);
  };

  if (loading) {
    return (
      <main className="p-4">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="px-4 pt-6 pb-40">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <PageTitle>日報編集</PageTitle>
        </div>
        <Card className="space-y-4 p-3 md:p-6 bg-white/50">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">
                {driverName}
              </h1>
              {plateNumber && (
                <div className="text-sm text-slate-500">
                  車両ナンバー:{" "}
                  <span className="font-semibold text-slate-700">
                    {plateNumber}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 hidden md:block">
              <Button
                variant="update"
                className="w-full"
                onClick={submit}
                disabled={saving}
                showIcon
              >
                {saving ? "更新中..." : "更新する"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card className="border border-mist-200">
                <FormSection
                  icon={<ClipboardPen size={24} />}
                  title="勤務情報"
                />
                <Input
                  label="日付"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />

                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    出勤区分
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setWorkStatus("出勤")}
                      className={`p-3 rounded-lg h-14 border border-teal-500 font-bold ${
                        workStatus === "出勤"
                          ? "bg-teal-500 text-white"
                          : "bg-white text-teal-500"
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
                      className={`p-3 rounded-lg h-14 border border-teal-500 font-bold ${
                        workStatus === "欠勤"
                          ? "bg-teal-500 text-white"
                          : "bg-white text-teal-500"
                      }`}
                    >
                      欠勤
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="業務開始時間"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <Input
                    label="業務終了時間"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
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
              </Card>

              <Card className="border border-mist-200">
                <FormSection
                  icon={<CircleCheckBig size={24} />}
                  title="運行前点検"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border border-mist-200">
                <FormSection icon={<Van size={24} />} title="走行情報" />
                <Input
                  label="配送エリア"
                  type="text"
                  value={deliveryArea}
                  onChange={(e) => setDeliveryArea(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="出発場所"
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                  />
                  <Input
                    label="出庫メーター"
                    type="number"
                    value={odometerStart}
                    suffix="km"
                    onChange={(e) => setOdometerStart(Number(e.target.value))}
                  />
                  <Input
                    label="帰着場所"
                    type="text"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                  />
                  <Input
                    label="帰庫メーター"
                    type="number"
                    value={odometerEnd}
                    suffix="km"
                    onChange={(e) => setOdometerEnd(Number(e.target.value))}
                  />
                </div>

                <div className="bg-slate-100 rounded-lg p-3 flex justify-between">
                  <span className="text-slate-500">走行距離</span>
                  <span className="font-bold text-slate-700">
                    {distance.toLocaleString()} km
                  </span>
                </div>
              </Card>
              <Card className="border border-mist-200">
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

              <Card className="border border-mist-200">
                <FormSection icon={<Package size={24} />} title="配送実績" />
                <Input
                  label="配達完了件数"
                  type="number"
                  value={deliveryCount}
                  suffix="件"
                  disabled={workStatus === "欠勤"}
                  onChange={(e) => setDeliveryCount(Number(e.target.value))}
                />
                <div className="bg-slate-100 rounded-lg p-3">
                  <div className="flex justify-between text-slate-700">
                    <span>単価</span>
                    <span>¥{unitPrice}</span>
                  </div>

                  <div className="flex justify-between font-semibold mt-2 text-slate-700">
                    <span>売上</span>
                    <span className="font-bold">¥{sales.toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              <Card className="border border-mist-200">
                <label className="block text-sm text-gray-500 mb-1">備考</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="border rounded-lg w-full py-3 px-2 bg-teal-50 border-teal-500 text-slate-700 outline-none"
                />
              </Card>
            </div>
          </div>

          <div className="w-full mx-auto left-0 right-0 fixed bottom-16 bg-teal-50/80 p-4 z-50 block md:hidden">
            <Button
              variant="update"
              onClick={submit}
              disabled={saving}
              showIcon
              className="w-full max-w-md mx-auto !flex"
            >
              {saving ? "更新中..." : "更新する"}
            </Button>
          </div>
        </Card>
        <PageActions
          actions={[
            {
              type: "back",
              href: `/reports/${id}`,
              label: "戻る",
              className: "w-24",
            },
          ]}
        />
      </div>
    </main>
  );
}

function formatTimeValue(value: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="block text-sm text-gray-500 mb-1">{label}</p>
      <div className="rounded-lg text-gray-500 bg-slate-100 px-4 py-3">
        {value}
      </div>
    </div>
  );
}
