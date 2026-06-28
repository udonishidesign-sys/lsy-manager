"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatYen } from "@/lib/drivers";
import Card from "@/components/ui/Card";
import PageTitle from "@/components/ui/PageTitle";
import {
  CalendarDays,
  ClipboardPen,
  JapaneseYen,
  Package,
  Route,
  UserRound,
} from "lucide-react";

type Driver = {
  id: number;
  name: string;
  status: string | null;
  project_id: number | null;
};

type Project = {
  id: number;
  name: string;
};

type Report = {
  id: number;
  driver_id: number;
  project_id: number | null;
  report_date: string;
  delivery_count: number | null;
  unit_price: number | null;
  odometer_start: number | null;
  odometer_end: number | null;
  work_status: string | null;
};

type DriverMonthlyTotal = {
  driver: Driver;
  projectName: string;
  reportCount: number;
  workDays: number;
  absences: number;
  deliveryCount: number;
  sales: number;
  mileage: number;
};

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return { from, to };
}

export default function DriverMonthlyPage() {
  const [month, setMonth] = useState(getCurrentMonthValue);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [projectFilter, setProjectFilter] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { from, to } = getMonthRange(month);

      const [{ data: driversData }, { data: projectsData }, { data: reportsData }] =
        await Promise.all([
          supabase
            .from("drivers")
            .select("id, name, status, project_id")
            .order("name", { ascending: true }),
          supabase.from("projects").select("id, name"),
          supabase
            .from("daily_reports")
            .select(
              "id, driver_id, project_id, report_date, delivery_count, unit_price, odometer_start, odometer_end, work_status",
            )
            .is("deleted_at", null)
            .gte("report_date", from)
            .lte("report_date", to),
        ]);

      setDrivers(driversData ?? []);
      setProjects(projectsData ?? []);
      setReports(reportsData ?? []);
      setLoading(false);
    };

    fetchData();
  }, [month]);

  const monthlyTotals = useMemo<DriverMonthlyTotal[]>(() => {
    const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

    return drivers
      .map((driver) => {
        const driverReports = reports.filter((r) => {
          const driverOk = r.driver_id === driver.id;
          const projectOk = projectFilter === "" || r.project_id === projectFilter;
          return driverOk && projectOk;
        });
        const workReports = driverReports.filter((r) => r.work_status !== "欠勤");
        const reportProjectIds = Array.from(
          new Set(
            driverReports
              .map((r) => r.project_id)
              .filter((projectId): projectId is number => projectId != null),
          ),
        );
        const deliveryCount = workReports.reduce(
          (sum, r) => sum + (r.delivery_count ?? 0),
          0,
        );
        const sales = workReports.reduce(
          (sum, r) => sum + (r.delivery_count ?? 0) * (r.unit_price ?? 0),
          0,
        );
        const mileage = workReports.reduce((sum, r) => {
          const distance = (r.odometer_end ?? 0) - (r.odometer_start ?? 0);
          return sum + Math.max(distance, 0);
        }, 0);

        return {
          driver,
          projectName:
            projectFilter !== ""
              ? projectNameById.get(projectFilter) ?? "-"
              : reportProjectIds.length > 1
                ? "複数案件"
                : projectNameById.get(reportProjectIds[0] ?? driver.project_id ?? 0) ??
                  "-",
          reportCount: driverReports.length,
          workDays: workReports.length,
          absences: driverReports.filter((r) => r.work_status === "欠勤").length,
          deliveryCount,
          sales,
          mileage,
        };
      })
      .filter((total) => total.reportCount > 0)
      .sort((a, b) => b.sales - a.sales);
  }, [drivers, projectFilter, projects, reports]);

  const summary = monthlyTotals.reduce(
    (sum, total) => ({
      drivers: sum.drivers + 1,
      workDays: sum.workDays + total.workDays,
      absences: sum.absences + total.absences,
      deliveryCount: sum.deliveryCount + total.deliveryCount,
      sales: sum.sales + total.sales,
      mileage: sum.mileage + total.mileage,
    }),
    {
      drivers: 0,
      workDays: 0,
      absences: 0,
      deliveryCount: 0,
      sales: 0,
      mileage: 0,
    },
  );

  return (
    <main className="px-4 pt-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <PageTitle>ドライバー月次集計</PageTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border p-2 rounded bg-white text-gray-600 border-mist-200"
            />
            <select
              value={projectFilter}
              onChange={(e) =>
                setProjectFilter(e.target.value ? Number(e.target.value) : "")
              }
              className="border p-2 rounded bg-white text-gray-600 border-mist-200"
            >
              <option value="">全案件</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Card className="border border-mist-200">
            <p className="text-sm text-slate-500">対象ドライバー</p>
            <p className="text-2xl font-bold text-slate-700">
              {summary.drivers}名
            </p>
          </Card>
          <Card className="border border-mist-200">
            <p className="text-sm text-slate-500">月間売上</p>
            <p className="text-2xl font-bold text-slate-700">
              {formatYen(summary.sales)}
            </p>
          </Card>
          <Card className="border border-mist-200">
            <p className="text-sm text-slate-500">配送数</p>
            <p className="text-2xl font-bold text-slate-700">
              {summary.deliveryCount.toLocaleString()}個
            </p>
          </Card>
          <Card className="border border-mist-200">
            <p className="text-sm text-slate-500">稼働日数</p>
            <p className="text-2xl font-bold text-slate-700">
              {summary.workDays.toLocaleString()}日
            </p>
          </Card>
          <Card className="border border-mist-200">
            <p className="text-sm text-slate-500">走行距離</p>
            <p className="text-2xl font-bold text-slate-700">
              {summary.mileage.toLocaleString()}km
            </p>
          </Card>
        </div>

        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          <div className="border rounded overflow-hidden border-mist-200">
            <div className="hidden md:flex justify-between bg-mist-200 px-4 py-2">
              <p className="font-semibold text-gray-600 w-1/6 flex gap-1">
                <UserRound size={20} />
                ドライバー
              </p>
              <p className="font-semibold text-gray-600 w-1/6 flex gap-1">
                <ClipboardPen size={20} />
                案件
              </p>
              <p className="font-semibold text-gray-600 w-1/8 flex gap-1">
                <CalendarDays size={20} />
                稼働/欠勤
              </p>
              <p className="font-semibold text-gray-600 w-1/8 flex gap-1">
                <Package size={20} />
                配送数
              </p>
              <p className="font-semibold text-gray-600 w-1/8 flex gap-1">
                <Route size={20} />
                走行距離
              </p>
              <p className="font-semibold text-gray-600 w-1/6 flex gap-1">
                <JapaneseYen size={20} />
                売上
              </p>
            </div>

            {loading ? (
              <div className="bg-white px-4 py-8 text-sm text-gray-500">
                読み込み中...
              </div>
            ) : monthlyTotals.length === 0 ? (
              <div className="bg-white px-4 py-8 text-sm text-gray-500">
                この月の集計対象の日報がありません
              </div>
            ) : (
              monthlyTotals.map((total) => (
                <Link
                  key={total.driver.id}
                  href={`/drivers/${total.driver.id}`}
                  className="flex flex-col md:flex-row md:items-center md:justify-between bg-white md:px-4 md:py-3 px-4 py-4 border-b last:border-none hover:bg-slate-50 transition"
                >
                  <p className="text-gray-700 w-full md:w-1/6 text-lg font-semibold flex justify-between border-dotted border-b border-mist-200 md:border-none py-2">
                    <span className="md:hidden text-sm text-gray-500">
                      ドライバー
                    </span>
                    {total.driver.name}
                  </p>
                  <p className="text-gray-600 w-full md:w-1/6 flex justify-between border-dotted border-b border-mist-200 md:border-none py-2">
                    <span className="md:hidden text-sm text-gray-500">案件</span>
                    {total.projectName}
                  </p>
                  <p className="text-gray-600 w-full md:w-1/8 flex justify-between border-dotted border-b border-mist-200 md:border-none py-2">
                    <span className="md:hidden text-sm text-gray-500">
                      稼働/欠勤
                    </span>
                    {total.workDays}日 / {total.absences}日
                  </p>
                  <p className="text-gray-600 w-full md:w-1/8 flex justify-between border-dotted border-b border-mist-200 md:border-none py-2">
                    <span className="md:hidden text-sm text-gray-500">配送数</span>
                    {total.deliveryCount.toLocaleString()}個
                  </p>
                  <p className="text-gray-600 w-full md:w-1/8 flex justify-between border-dotted border-b border-mist-200 md:border-none py-2">
                    <span className="md:hidden text-sm text-gray-500">
                      走行距離
                    </span>
                    {total.mileage.toLocaleString()}km
                  </p>
                  <p className="text-gray-700 w-full md:w-1/6 text-lg font-semibold flex justify-between py-2">
                    <span className="md:hidden text-sm text-gray-500">売上</span>
                    {formatYen(total.sales)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
