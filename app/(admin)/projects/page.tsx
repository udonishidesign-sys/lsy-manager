"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import PageActions from "@/components/ui/PageActions";
import PageTitle from "@/components/ui/PageTitle";
import Button from "@/components/ui/Button";
import { Pen, Plus } from "lucide-react";

type Project = {
  id: number;
  name: string;
  current_unit_price: number;
  created_at: string;
};

function formatYen(value: number) {
  return `¥${value.toLocaleString()}`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const deleteProject = async (id: number) => {
    const ok = confirm("この案件を削除しますか？");
    if (!ok) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("id");
      console.log("projects data:", data);
      console.log("projects error:", error);

      if (error) {
        console.error(error);
        return;
      }

      setProjects(data ?? []);
      setLoading(false);
    };
    fetchProjects();
  }, []);

  return (
    <main className="p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <PageTitle>案件管理</PageTitle>
          <PageActions
            actions={[
              {
                type: "create",
                href: "/projects/new",
                label: "案件を追加する",
                icon: <Plus size={18} />,
              },
            ]}
          />
        </div>
        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          {loading ? (
            <div className="bg-white rounded-xl p-4 shadow">読み込み中...</div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-xl p-4 shadow">
              案件がありません
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card className="border border-mist-200" key={project.id}>
                  <p className="font-semibold text-slate-900">{project.name}</p>
                  <p className="text-gray-500">
                    単価：{formatYen(project.current_unit_price)}
                  </p>
                  <div className="flex justify-between gap-2">
                    <PageActions
                      actions={[
                        {
                          type: "edit",
                          href: `/projects/${project.id}`,
                          label: "編集する",
                          icon: <Pen size={18} />,
                        },
                      ]}
                    />
                    <Button
                      variant="delete"
                      iconOnly
                      onClick={() => deleteProject(project.id)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
