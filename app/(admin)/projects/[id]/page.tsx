"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageActions from "@/components/ui/PageActions";
import PageTitle from "@/components/ui/PageTitle";
import { Plus } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) {
        console.error(error);
        alert("案件が見つかりません");
        router.push("/projects");
        return;
      }
      setName(data.name);
      setUnitPrice(String(data.current_unit_price));
      setLoading(false);
    };

    fetchProject();
  }, [projectId, router]);

  const saveProject = async () => {
    if (!name.trim()) {
      alert("案件名を入力してください");
      return;
    }
    if (!unitPrice) {
      alert("単価を入力してください");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("projects")
      .update({
        name,
        current_unit_price: Number(unitPrice),
      })
      .eq("id", projectId);
    setSaving(false);
    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }
    alert("更新しました");
    router.push("/projects");
  };
  if (loading) {
    return (
      <main className="p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl p-4 shadow">読み込み中...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <PageTitle>案件編集</PageTitle>
        </div>
        <Card className="border border-mist-200">
          <Input
            label="案件名"
            type="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="単価"
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </Card>
        <div className="flex items-center gap-4 mt-6">
          <Button
            onClick={saveProject}
            disabled={loading}
            showIcon
            variant="save"
          >
            {saving ? "保存中..." : "保存"}
          </Button>
          <PageActions
            actions={[
              {
                type: "back",
                href: `/projects`,
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
