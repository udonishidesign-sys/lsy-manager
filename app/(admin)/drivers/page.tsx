"use client";

import { useEffect, useMemo, useState } from "react";
import { type Driver } from "@/lib/drivers";
import { syncDriverStatsFromReports } from "@/lib/sync";
import { supabase } from "@/lib/supabase";
import PageActions from "@/components/ui/PageActions";
import PageTitle from "@/components/ui/PageTitle";
import { Plus, Search, Users, Package } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";

type Project = {
  id: number;
  name: string;
};

type DriverProject = {
  driver_id: number;
  project_id: number;
};

type DriverWithProjects = Driver & {
  projectIds: number[];
};

type StatusFilter = "すべて" | "稼働中" | "休職中" | "退職";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [drivers, setDrivers] = useState<DriverWithProjects[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("すべて");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        await syncDriverStatsFromReports();

        const [
          { data: driversData, error: driversError },
          { data: projectsData, error: projectsError },
          { data: driverProjectsData, error: driverProjectsError },
        ] = await Promise.all([
          supabase.from("drivers").select("*").order("id", { ascending: true }),

          supabase
            .from("projects")
            .select("id, name")
            .order("id", { ascending: true }),

          supabase.from("driver_projects").select("driver_id, project_id"),
        ]);

        if (driversError) throw driversError;
        if (projectsError) throw projectsError;
        if (driverProjectsError) throw driverProjectsError;

        const projectLinks = (driverProjectsData ?? []) as DriverProject[];

        const driversWithProjects: DriverWithProjects[] = (
          driversData ?? []
        ).map((driver) => ({
          ...(driver as Driver),
          projectIds: [
            ...new Set(
              projectLinks
                .filter((link) => link.driver_id === driver.id)
                .map((link) => link.project_id),
            ),
          ],
        }));

        setDrivers(driversWithProjects);
        setProjects((projectsData ?? []) as Project[]);
      } catch (error) {
        console.error("ドライバー一覧の取得に失敗しました:", error);
        setErrorMessage(
          "ドライバー情報を取得できませんでした。時間をおいて再度お試しください。",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch = driver.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesStatus =
        statusFilter === "すべて" || (driver.status as string) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [drivers, search, statusFilter]);

  const statusCounts = useMemo(
    () => ({
      all: drivers.length,
      active: drivers.filter((d) => d.status === "稼働中").length,
      leave: drivers.filter((d) => d.status === "休職中").length,
      retired: drivers.filter((d) => (d.status as string) === "退職").length,
    }),
    [drivers],
  );

  const statusOptions: StatusFilter[] = ["すべて", "稼働中", "休職中", "退職"];

  return (
    <main className="p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <PageTitle>ドライバー一覧</PageTitle>

          <PageActions
            actions={[
              {
                type: "create",
                href: "/drivers/new",
                icon: <Plus size={18} />,
                label: "ドライバーを追加",
              },
            ]}
          />
        </div>

        {/* 人数集計 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Users size={16} />
              全ドライバー
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">
              {statusCounts.all}
              <span className="text-sm font-normal ml-1">名</span>
            </p>
          </Card>

          <Card className="p-3">
            <p className="text-sm text-slate-500">稼働中</p>
            <p className="text-2xl font-bold text-slate-800 mt-2">
              {statusCounts.active}
              <span className="text-sm font-normal ml-1">名</span>
            </p>
          </Card>

          <Card className="p-3">
            <p className="text-sm text-slate-500">休職中</p>
            <p className="text-2xl font-bold text-slate-800 mt-2">
              {statusCounts.leave}
              <span className="text-sm font-normal ml-1">名</span>
            </p>
          </Card>

          <Card className="p-3">
            <p className="text-sm text-slate-500">退職</p>
            <p className="text-2xl font-bold text-slate-800 mt-2">
              {statusCounts.retired}
              <span className="text-sm font-normal ml-1">名</span>
            </p>
          </Card>
        </div>

        {/* 検索・絞り込み */}
        <Card className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              ドライバーを検索
            </label>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ドライバー名を入力"
                className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-3 text-base outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              稼働状況
            </label>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                    statusFilter === status
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {status}
                  {status === "すべて" && ` (${statusCounts.all})`}
                  {status === "稼働中" && ` (${statusCounts.active})`}
                  {status === "休職中" && ` (${statusCounts.leave})`}
                  {status === "退職" && ` (${statusCounts.retired})`}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ドライバー一覧 */}
        <Card className="p-3 md:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">ドライバー</h2>
            <span className="text-sm text-slate-500">
              {filteredDrivers.length} 名
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              読み込み中...
            </div>
          ) : errorMessage ? (
            <div className="py-10 text-center text-red-600 text-sm">
              {errorMessage}
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              該当するドライバーはいません。
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDrivers.map((driver) => {
                const driverProjectNames = driver.projectIds
                  .map(
                    (projectId) =>
                      projects.find((project) => project.id === projectId)
                        ?.name,
                  )
                  .filter((name): name is string => Boolean(name));

                return (
                  <div
                    key={driver.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <StatusBadge status={driver.status} />
                        <p className="font-bold text-slate-800 text-base">
                          {driver.name}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Package size={15} className="shrink-0" />
                          <span>担当案件</span>
                        </div>

                        {driverProjectNames.length === 0 ? (
                          <p className="text-sm text-slate-500 pl-6">未設定</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 pl-6">
                            {driverProjectNames.map((projectName, index) => (
                              <span
                                key={`${driver.id}-${index}`}
                                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                {projectName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <PageActions
                        actions={[
                          {
                            type: "detail",
                            href: `/drivers/${driver.id}`,
                            label: "詳細を見る",
                          },
                        ]}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
