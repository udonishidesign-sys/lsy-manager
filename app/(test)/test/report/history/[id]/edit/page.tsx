"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";
import CustomTimeSelect from "@/components/ui/CustomTimeSelect";
import { getDriverSessionId, clearDriverSession } from "@/lib/driver-session";
import { ClipboardPen, Package, Van, FileText, Clock } from "lucide-react";

type Project = {
  id: number;
  name: string;
  current_unit_price: number;
};
type DriverProject = {
  project_id: number;
  project: Project;
};
export default function ReportEditPage() {
  const router = useRouter();
  const [driverId, setDriverId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [unitPrice, setUnitPrice] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [deliveryArea, setDeliveryArea] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [actualStartLocation, setActualStartLocation] = useState("");
  const [actualEndLocation, setActualEndLocation] = useState("");
  const [mainTransitPoints, setMainTransitPoints] = useState("");
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
  const [odometerStart, setOdometerStart] = useState(0);
  const [odometerEnd, setOdometerEnd] = useState(0);
  const [carryOutAm, setCarryOutAm] = useState(0);
  const [carryOutPm, setCarryOutPm] = useState(0);
  const [carryBackAm, setCarryBackAm] = useState(0);
  const [carryBackPm, setCarryBackPm] = useState(0);
  const [lastDeliveryAm, setLastDeliveryAm] = useState("");
  const [lastDeliveryPm, setLastDeliveryPm] = useState("");
  const [collectionCount, setCollectionCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const selectedProject = projects.find((p) => p.id === projectId);
  const projectName = selectedProject?.name ?? "";
  const isShein = projectName === "SHEIN";
  const isCSOSakaTech = projectName === "CS大阪テック";
  const [plateNumber, setPlateNumber] = useState("");
  const searchParams = useSearchParams();
  const reportId = Number(searchParams.get("id"));
  const [absenceReason, setAbsenceReason] = useState("");
  const distance = Math.max(odometerEnd - odometerStart, 0);
  const [returnedDeliveryCount, setReturnedDeliveryCount] = useState(0);

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
  // ドライバー情報取得
  // 複数案件対応
  // -----------------------------
  useEffect(() => {
    if (!driverId) return;

    const loadDriver = async () => {
      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", driverId)
        .single();

      if (driverError || !driver) {
        console.error(driverError);
        return;
      }

      setPlateNumber(driver.plate_number ?? "");

      // ドライバーに紐づいている案件を取得
      const { data: driverProjects, error: projectError } = await supabase
        .from("driver_projects")
        .select(
          `
        project_id,
        project:projects (
          id,
          name,
          current_unit_price
        )
      `,
        )
        .eq("driver_id", driverId);

      if (projectError) {
        console.error(projectError);
        return;
      }

      const projectList = (driverProjects ?? [])
        .map((item: any) => item.project)
        .filter(Boolean) as Project[];

      setProjects(projectList);

      if (projectList.length === 1) {
        setProjectId(projectList[0].id);
        setUnitPrice(projectList[0].current_unit_price ?? 0);
      }

      // 案件が複数の場合
      // → 日報編集では既存の日報の project_id を優先するので
      // ここでは projectName は設定しない

      // 案件情報から配送情報を取得
      // ※現在のDB構造で projects にこのカラムがある場合
      if (projectList.length === 1) {
        const project = projectList[0];

        const { data: projectDetail } = await supabase
          .from("projects")
          .select("*")
          .eq("id", project.id)
          .single();

        if (projectDetail) {
          setDeliveryArea(projectDetail.delivery_area ?? "");
          setStartLocation(projectDetail.start_location ?? "");
          setEndLocation(projectDetail.end_location ?? "");
        }
      }
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

      const { data: project } = await supabase
        .from("projects")
        .select("id, name, current_unit_price")
        .eq("id", data.project_id)
        .single();

      if (project) {
        setUnitPrice(data.unit_price ?? project.current_unit_price ?? 0);
      }

      setDate(data.report_date);
      setDeliveryCount(data.delivery_count ?? 0);
      setReturnedDeliveryCount(data.returned_delivery_count ?? 0);
      setDeliveryArea(data.delivery_area ?? "");
      setStartLocation(data.start_location ?? "");
      setEndLocation(data.end_location ?? "");
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
      setAbsenceReason(data.absence_reason ?? "");
      setPlateNumber(data.plate_number ?? "");
      setActualStartLocation(data.actual_start_location ?? "");
      setActualEndLocation(data.actual_end_location ?? "");
      setMainTransitPoints(data.main_transit_points ?? "");
      setBreakSleepRecords(data.break_sleep_records ?? "");
      setDriverChangeRecords(data.driver_change_records ?? "該当なし");
      setWaitingRecords(data.waiting_records ?? "該当なし");
      setCargoHandlingRecords(data.cargo_handling_records ?? "該当なし");
      setIncidentRecords(data.incident_records ?? "該当なし");
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

    if (!projectId) {
      alert("案件が選択されていません");
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
      if (!plateNumber.trim()) {
        alert("車両ナンバーが未登録です。管理者に登録を依頼してください。");
        return;
      }
      if (
        !actualStartLocation.trim() ||
        !actualEndLocation.trim() ||
        !mainTransitPoints.trim()
      ) {
        alert("実際の業務開始地点・終了地点・主な経過地点を入力してください。");
        return;
      }
      if (!startTime || !endTime) {
        alert("業務開始時刻と業務終了時刻を入力してください。");
        return;
      }
      if ((breakStart || breakEnd) && !breakSleepRecords.trim()) {
        alert(
          "休憩時刻を入力した場合は、休憩した地点と日時も記録してください。",
        );
        return;
      }
      if (odometerStart <= 0 || odometerEnd <= 0) {
        alert("出庫メーターと帰庫メーターを入力してください。");
        return;
      }
      if (odometerEnd < odometerStart) {
        alert("帰庫メーターは出庫メーター以上の値を入力してください。");
        return;
      }
    }

    setSaving(true);

    const reportData = {
      driver_id: driverId,
      project_id: projectId,
      plate_number: plateNumber || null,
      report_date: date,
      delivery_count: workStatus === "欠勤" ? 0 : deliveryCount,
      returned_delivery_count:
        workStatus === "欠勤" ? 0 : returnedDeliveryCount,
      delivery_area: workStatus === "欠勤" ? null : deliveryArea || null,
      unit_price: unitPrice,
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
      last_delivery_am: null,
      last_delivery_pm: null,
      odometer_start: workStatus === "欠勤" ? 0 : odometerStart,
      odometer_end: workStatus === "欠勤" ? 0 : odometerEnd,
      carry_out_am: workStatus === "欠勤" ? 0 : carryOutAm,
      carry_out_pm: 0,
      carry_back_am: 0,
      carry_back_pm: 0,
      collection_count: 0,
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
    <main className="px-4 pt-24 pb-40">
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

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                車両ナンバー
              </label>
              <div className="rounded-lg text-gray-500 bg-slate-100 px-4 py-3 flex items-center">
                {plateNumber || "未登録"}
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
          </Card>
          {workStatus !== "欠勤" && !isShein && (
            <>
              {/* 走行情報 */}
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
                  </div>
                </div>
                <div className="bg-slate-100 rounded-lg p-3 flex justify-between">
                  <span className="text-slate-500">走行距離</span>
                  <span className="font-bold text-slate-700">
                    {distance.toLocaleString()} km
                  </span>
                </div>
              </Card>
            </>
          )}
          {workStatus !== "欠勤" && (
            <Card>
              <FormSection icon={<Clock size={24} />} title="法定運行記録" />
              <p className="mb-3 text-xs text-slate-500">
                運行の実態に合わせて記録してください。案件に登録された予定地点ではなく、実際の地点を入力します。
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    実際の業務開始地点（必須）
                  </label>
                  <input
                    required
                    value={actualStartLocation}
                    onChange={(e) => setActualStartLocation(e.target.value)}
                    placeholder="実際に業務を開始した場所"
                    className="h-12 w-full rounded-lg border border-teal-500 bg-teal-50 px-3 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    実際の業務終了地点（必須）
                  </label>
                  <input
                    required
                    value={actualEndLocation}
                    onChange={(e) => setActualEndLocation(e.target.value)}
                    placeholder="実際に業務を終了した場所"
                    className="h-12 w-full rounded-lg border border-teal-500 bg-teal-50 px-3 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    主な経過地点（必須）
                  </label>
                  <textarea
                    required
                    value={mainTransitPoints}
                    onChange={(e) => setMainTransitPoints(e.target.value)}
                    rows={2}
                    placeholder="例：〇〇センター、△△配送エリア、□□営業所（順番に記入）"
                    className="w-full rounded-lg border border-teal-500 bg-teal-50 px-3 py-2 text-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="出庫メーター（必須）"
                    type="number"
                    value={odometerStart}
                    suffix="km"
                    onChange={(e) => setOdometerStart(Number(e.target.value))}
                  />
                  <Input
                    label="帰庫メーター（必須）"
                    type="number"
                    value={odometerEnd}
                    suffix="km"
                    onChange={(e) => setOdometerEnd(Number(e.target.value))}
                  />
                </div>
                <div className="bg-slate-100 rounded-lg p-3 flex justify-between">
                  <span className="text-slate-500">業務に従事した距離</span>
                  <span className="font-bold text-slate-700">
                    {distance.toLocaleString()} km
                  </span>
                </div>
                <CustomTimeSelect
                  label="業務開始日時の時刻（必須）"
                  value={startTime}
                  onChange={setStartTime}
                />
                <CustomTimeSelect
                  label="業務終了日時の時刻（必須）"
                  value={endTime}
                  onChange={setEndTime}
                />
                <div className="grid grid-cols-2 gap-3">
                  <CustomTimeSelect
                    label="休憩開始（代表）"
                    value={breakStart}
                    onChange={setBreakStart}
                  />
                  <CustomTimeSelect
                    label="休憩終了（代表）"
                    value={breakEnd}
                    onChange={setBreakEnd}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    休憩・睡眠の地点と日時（複数ある場合はすべて記入）
                  </label>
                  <textarea
                    value={breakSleepRecords}
                    onChange={(e) => setBreakSleepRecords(e.target.value)}
                    rows={3}
                    placeholder={
                      "例：休憩 12:00〜12:30／〇〇駐車場\n睡眠 〇月〇日 〇時〜〇時／場所"
                    }
                    className="w-full rounded-lg border border-teal-500 bg-teal-50 px-3 py-2 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    業務を交替した場合の地点・日時
                  </label>
                  <textarea
                    value={driverChangeRecords}
                    onChange={(e) => setDriverChangeRecords(e.target.value)}
                    rows={2}
                    placeholder="交替がなければ空欄。ある場合は交替地点と日時を記入"
                    className="w-full rounded-lg border border-teal-500 bg-teal-50 px-3 py-2 text-slate-700"
                  />
                </div>
              </div>
            </Card>
          )}
          {workStatus !== "欠勤" && (
            <Card>
              <FormSection
                icon={<Clock size={24} />}
                title="待機・荷役・附帯業務の記録"
              />
              <p className="mb-3 text-xs text-slate-500">
                該当する業務があった場合に記録してください。待機が30分以上の場合は、地点・到着日時・積込/取卸開始終了・附帯業務開始終了・出発日時を記録します。
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    荷主都合による30分以上の待機
                  </label>
                  <textarea
                    value={waitingRecords}
                    onChange={(e) => setWaitingRecords(e.target.value)}
                    rows={3}
                    placeholder={
                      "地点／指定到着日時（指定がある場合）／実際の到着日時／積込・取卸開始終了／附帯業務開始終了／出発日時"
                    }
                    className="w-full rounded-lg border border-teal-500 bg-teal-50 px-3 py-2 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    荷役作業・附帯業務
                  </label>
                  <textarea
                    value={cargoHandlingRecords}
                    onChange={(e) => setCargoHandlingRecords(e.target.value)}
                    rows={3}
                    placeholder="地点／作業内容（積込・取卸・仕分け等）／開始日時／終了日時／荷主確認の有無"
                    className="w-full rounded-lg border border-teal-500 bg-teal-50 px-3 py-2 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    事故・異常・著しい遅延など
                  </label>
                  <textarea
                    value={incidentRecords}
                    onChange={(e) => setIncidentRecords(e.target.value)}
                    rows={2}
                    placeholder="発生日時／場所／概要／原因／対応・再発防止策（該当時）"
                    className="w-full rounded-lg border border-teal-500 bg-teal-50 px-3 py-2 text-slate-700"
                  />
                </div>
              </div>
            </Card>
          )}
          {workStatus !== "欠勤" && (
            <>
              {/* 配送実績 */}
              <Card>
                <FormSection icon={<Package size={24} />} title="配送実績" />

                <Input
                  label="配達完了件数"
                  type="number"
                  value={deliveryCount}
                  suffix="件"
                  onChange={(e) => setDeliveryCount(Number(e.target.value))}
                />

                {!isShein && (
                  <>
                    {!isCSOSakaTech && (
                      <Input
                        label="不在持ち帰り件数"
                        type="number"
                        value={returnedDeliveryCount}
                        suffix="件"
                        onChange={(e) =>
                          setReturnedDeliveryCount(Number(e.target.value))
                        }
                      />
                    )}
                    <Input
                      label="伝票枚数"
                      type="number"
                      value={carryOutAm}
                      suffix="枚"
                      onChange={(e) => setCarryOutAm(Number(e.target.value))}
                    />
                  </>
                )}
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
