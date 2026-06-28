"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import PageTitle from "@/components/ui/PageTitle";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Driver = {
  id: number;
  name: string;
};

type DriverShift = {
  id?: number;
  driver_id: number;
  shift_date: string;
  shift_status: "休み";
  note?: string | null;
};

type DailyReport = {
  driver_id: number;
  report_date: string;
  work_status: string | null;
};

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getMonthDays(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: lastDay }, (_, index) => {
    const date = new Date(year, month, index + 1);

    return {
      date,
      dateText: formatDate(date),
      day: index + 1,
      weekday: ["日", "月", "火", "水", "木", "金", "土"][date.getDay()],
      isSunday: date.getDay() === 0,
      isSaturday: date.getDay() === 6,
    };
  });
}

export default function ShiftsPage() {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [shifts, setShifts] = useState<Record<string, DriverShift>>({});
  const [absences, setAbsences] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const from = formatDate(new Date(year, month, 1));
      const to = formatDate(new Date(year, month + 1, 0));

      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("id, name")
        .order("id");

      const { data: shiftsData, error: shiftsError } = await supabase
        .from("driver_shifts")
        .select("*")
        .gte("shift_date", from)
        .lte("shift_date", to);

      const { data: reportsData, error: reportsError } = await supabase
        .from("daily_reports")
        .select("driver_id, report_date, work_status")
        .gte("report_date", from)
        .lte("report_date", to)
        .is("deleted_at", null);

      if (driversError || shiftsError || reportsError) {
        const error = driversError || shiftsError || reportsError;
        console.error(error);
        alert(error?.message);
        setLoading(false);
        return;
      }

      const shiftMap: Record<string, DriverShift> = {};

      for (const shift of shiftsData ?? []) {
        if (shift.shift_status === "休み") {
          shiftMap[`${shift.driver_id}_${shift.shift_date}`] = shift;
        }
      }

      const absenceMap: Record<string, boolean> = {};

      for (const report of (reportsData ?? []) as DailyReport[]) {
        if (report.work_status === "欠勤") {
          absenceMap[`${report.driver_id}_${report.report_date}`] = true;
        }
      }

      setDrivers(driversData ?? []);
      setShifts(shiftMap);
      setAbsences(absenceMap);
      setLoading(false);
    };

    fetchData();
  }, [year, month]);

  const changeMonth = (amount: number) => {
    const next = new Date(year, month + amount, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const getDisplayStatus = (driverId: number, dateText: string) => {
    const key = `${driverId}_${dateText}`;

    if (absences[key]) return "欠勤";
    if (shifts[key]?.shift_status === "休み") return "休み";

    return "出勤";
  };

  const toggleHoliday = async (driverId: number, dateText: string) => {
    const key = `${driverId}_${dateText}`;

    if (absences[key] || savingKeys[key]) return;

    const current = shifts[key];

    setSavingKeys((prev) => ({
      ...prev,
      [key]: true,
    }));

    if (current?.shift_status === "休み") {
      const previousShift = current;

      setShifts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      const { error } = await supabase
        .from("driver_shifts")
        .delete()
        .eq("driver_id", driverId)
        .eq("shift_date", dateText);

      if (error) {
        setShifts((prev) => ({
          ...prev,
          [key]: previousShift,
        }));
        alert(error.message);
      }

      setSavingKeys((prev) => ({
        ...prev,
        [key]: false,
      }));

      return;
    }

    const nextShift = {
      driver_id: driverId,
      shift_date: dateText,
      shift_status: "休み" as const,
    };

    setShifts((prev) => ({
      ...prev,
      [key]: nextShift,
    }));

    const { error } = await supabase.from("driver_shifts").upsert([nextShift], {
      onConflict: "driver_id,shift_date",
    });

    if (error) {
      setShifts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      alert(error.message);
    }

    setSavingKeys((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

  const getCellClass = (status: string) => {
    if (status === "欠勤") {
      return "border-amber-400 bg-amber-100 text-amber-600 cursor-not-allowed";
    }

    if (status === "休み") {
      return "bg-red-100 text-red-600 border-red-300 cursor-pointer";
    }

    return "border border-mist-300 bg-teal-50 hover:bg-teal-50 cursor-pointer align-middle";
  };

  return (
    <main className="p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-4">
          <PageTitle>シフト管理</PageTitle>
        </div>

        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="inline-flex items-center gap-1 pl-1.5 pr-3 py-2 rounded-lg border border-teal-500 text-teal-600 font-bold cursor-pointer hover:bg-teal-50"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">前月</span>
            </button>

            <div className="text-lg font-bold text-slate-700">
              {year}年 {month + 1}月
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="inline-flex items-center gap-1 pl-3 pr-1.5 py-2 rounded-lg border border-teal-500 text-teal-600 font-bold cursor-pointer hover:bg-teal-50"
            >
              <span className="hidden sm:inline">翌月</span>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded border border-mist-300 bg-teal-50" />
              空欄: 出勤扱い
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded border border-red-300 bg-red-100" />
              休み
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded border border-amber-400 bg-amber-100" />
              欠勤
            </span>
          </div>

          {loading ? (
            <p className="text-slate-500">読み込み中...</p>
          ) : (
            <div className="overflow-x-auto border border-mist-200 rounded-lg">
              <table className="min-w-max w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-mist-200">
                    <th className="sticky left-0 z-20 bg-mist-200 px-3 py-2 text-left text-sm text-slate-600 min-w-24">
                      ドライバー
                    </th>

                    {days.map((day) => (
                      <th
                        key={day.dateText}
                        className={`px-2 py-2 text-center text-xs min-w-12 ${
                          day.isSunday
                            ? "text-red-500"
                            : day.isSaturday
                              ? "text-sky-500"
                              : "text-slate-600"
                        }`}
                      >
                        <div>{day.day}</div>
                        <div>{day.weekday}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="border-t border-mist-200">
                      <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-sm text-slate-700 min-w-36">
                        {driver.name}
                      </th>

                      {days.map((day) => {
                        const key = `${driver.id}_${day.dateText}`;
                        const status = getDisplayStatus(
                          driver.id,
                          day.dateText,
                        );
                        const savingCell = savingKeys[key];
                        const disabled = status === "欠勤" || savingCell;

                        return (
                          <td key={day.dateText} className="px-1 py-2">
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() =>
                                toggleHoliday(driver.id, day.dateText)
                              }
                              className={`w-full h-9 rounded border px-1 text-xs font-bold transition ${getCellClass(
                                status,
                              )} ${savingCell ? "opacity-60 cursor-wait" : ""}`}
                              title={`${driver.name} ${day.dateText} ${status}`}
                            >
                              {savingCell
                                ? "..."
                                : status === "出勤"
                                  ? ""
                                  : status}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
