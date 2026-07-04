"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatYen } from "@/lib/drivers";
import PageTitle from "@/components/ui/PageTitle";
import PageActions from "@/components/ui/PageActions";
import Card from "@/components/ui/Card";
import {
  ClipboardPen,
  Calendar,
  Package,
  UserRound,
  JapaneseYen,
} from "lucide-react";

type Report = {
  id: number;
  driver_id: number;
  project_id: number;
  report_date: string;
  delivery_count: number;
  delivery_area: string | null;
  unit_price: number;
  work_status: string;
  note: string | null;
  attachment_url: string | null;
};
type Driver = {
  id: number;
  name: string;
};
type Project = {
  id: number;
  name: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [driverFilter, setDriverFilter] = useState<number | "">("");
  const [projectFilter, setProjectFilter] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const pageSize = 10;

  useEffect(() => {
    const fetchData = async () => {
      const { data: reportsData } = await supabase
        .from("daily_reports")
        .select("*")
        .is("deleted_at", null)
        .order("report_date", { ascending: false });

      const { data: driversData } = await supabase
        .from("drivers")
        .select("id, name");

      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name");

      setReports(reportsData ?? []);
      setDrivers(driversData ?? []);
      setProjects(projectsData ?? []);
    };

    fetchData();
  }, []);

  const filteredReports = reports.filter((r) => {
    const driverOk = driverFilter === "" || r.driver_id === driverFilter;
    const projectOk = projectFilter === "" || r.project_id === projectFilter;
    const fromOk = !fromDate || r.report_date >= fromDate;
    const toOk = !toDate || r.report_date <= toDate;
    return driverOk && projectOk && fromOk && toOk;
  });
  const start = (page - 1) * pageSize;
  const paginatedReports = filteredReports.slice(start, start + pageSize);
  const totalPages = Math.ceil(filteredReports.length / pageSize);

  return (
    <main className="px-4 pt-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <PageTitle>日報一覧</PageTitle>
          <span className="text-sm text-gray-500">{reports.length}件</span>
        </div>

        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          <div className="flex gap-6 md:mt-4 mt-0 flex-wrap md:flex-nowrap">
            <div className="flex md:gap-6 gap-4 md:w-3/5 w-full">
              <select
                value={driverFilter}
                onChange={(e) =>
                  setDriverFilter(e.target.value ? Number(e.target.value) : "")
                }
                className="border p-2 rounded w-full text-gray-500 bg-white border-mist-200"
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
                  setProjectFilter(e.target.value ? Number(e.target.value) : "")
                }
                className="border p-2 rounded w-full text-gray-500 bg-white border-mist-200"
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
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border p-2 rounded w-full bg-white text-gray-500 border-mist-200"
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
                  onChange={(e) => setToDate(e.target.value)}
                  className="border p-2 rounded w-full bg-white text-gray-500 border-mist-200"
                />
              </div>
            </div>
          </div>
        </Card>
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
              <div className="">日報がありません</div>
            ) : (
              paginatedReports.map((r) => {
                const driverName =
                  drivers.find((d) => d.id === r.driver_id)?.name ?? "不明";

                const projectName =
                  projects.find((p) => p.id === r.project_id)?.name ?? "不明";

                const sales = (r.delivery_count ?? 0) * (r.unit_price ?? 0);

                return (
                  <div
                    key={r.id}
                    className="flex justify-between flex-col md:flex-row items-center bg-white md:px-4 md:py-2 px-4 py-4 border-b last:border-none"
                  >
                    <p className="text-gray-600 w-full md:w-1/7 text-left text-bold text-lg flex justify-between border-dotted border-b border-mist-200 md:border-none !py-2">
                      <label className="md:hidden text-sm mr-2 flex items-center gap-1">
                        <Calendar size={24} className="text-teal-500" />
                        <span>日付</span>
                      </label>
                      {r.report_date}
                    </p>

                    <p className="text-gray-600 w-full md:w-1/7 text-left text-lg flex justify-between border-b border-dotted border-mist-200 md:border-none !py-2">
                      <label className="md:hidden text-sm mr-2 flex items-center gap-1">
                        <UserRound size={24} className="text-teal-500" />
                        <span>ドライバー</span>
                      </label>
                      {driverName}
                    </p>

                    <p className="text-gray-600 w-full md:w-2/10 text-left text-lg flex justify-between border-b border-dotted border-mist-200 md:border-none !py-2">
                      <label className="md:hidden text-sm mr-2 flex items-center gap-1">
                        <ClipboardPen size={24} className="text-teal-500" />
                        <span>案件</span>
                      </label>{" "}
                      {projectName}
                    </p>

                    <p className="text-gray-600 w-full md:w-1/8 text-lefttext-lg flex justify-between border-b border-dotted border-mist-200 md:border-none !py-2">
                      <label className="md:hidden text-sm mr-2 flex items-center gap-1">
                        <Package size={24} className="text-teal-500" />
                        <span>配送数</span>
                      </label>{" "}
                      <span>
                        {r.delivery_count}個
                        {r.delivery_area && (
                          <span className="block text-xs text-gray-400">{r.delivery_area}</span>
                        )}
                      </span>
                    </p>

                    <p className="text-gray-600 w-full md:w-1/7 text-left text-lg flex justify-between border-b border-dotted border-mist-200 md:border-none !py-2">
                      <label className="md:hidden text-sm mr-2 flex items-center gap-1">
                        <JapaneseYen size={24} className="text-teal-500" />
                        <span>売上</span>
                      </label>
                      {formatYen(sales)}
                    </p>
                    <div className="text-gray-600 w-full md:w-1/10 text-left md:mt-0 mt-4 hidden md:block">
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
                    <div className="text-gray-600 w-full md:w-1/10 text-left md:mt-0 mt-4 block md:hidden">
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
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 border border-teal-600 text-teal-600 rounded-lg hover:text-white hover:bg-teal-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-teal-600"
        >
          前へ
        </button>
        <span className="text-sm text-gray-600">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="px-3 py-1 border border-teal-600 text-teal-600 rounded-lg hover:text-white hover:bg-teal-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-teal-600"
        >
          次へ
        </button>
      </div>
    </main>
  );
}
