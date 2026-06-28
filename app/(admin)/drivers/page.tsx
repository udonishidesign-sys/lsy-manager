"use client";

import { useEffect, useState } from "react";
import { type Driver } from "@/lib/drivers";
import { syncDriverStatsFromReports } from "@/lib/sync";
import { supabase } from "@/lib/supabase";
import PageActions from "@/components/ui/PageActions";
import PageTitle from "@/components/ui/PageTitle";
import { Plus } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";

type Project = {
  id: number;
  name: string;
};
type DriverWithProject = Driver & {
  project_id: number | null;
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [drivers, setDrivers] = useState<DriverWithProject[]>([]);

  useEffect(() => {
    syncDriverStatsFromReports();
    const fetchDrivers = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("id");

      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name");

      if (error) {
        console.error(error);
        return;
      }

      setDrivers(data ?? []);
      setProjects(projectsData ?? []);
    };
    fetchDrivers();
  }, []);

  return (
    <main className="p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
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
        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          <div className="space-y-4">
            {drivers.map((d) => {
              const projectName =
                projects.find((p) => p.id === d.project_id)?.name ?? "不明";

              return (
                <Card
                  key={d.id}
                  className="border border-mist-200 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4 text-slate-700 font-bold mb-0">
                    <StatusBadge status={d.status} />
                    <span>{d.name}</span>
                    <span className="text-sm text-slate-500 font-normal">
                      {projectName}
                    </span>
                  </div>

                  <PageActions
                    actions={[
                      {
                        type: "detail",
                        href: `/drivers/${d.id}`,
                        label: "詳細を見る",
                      },
                    ]}
                  />
                </Card>
              );
            })}
          </div>
        </Card>
      </div>
    </main>
  );
}
