"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Card from "@/components/ui/Card";
import PageTitle from "@/components/ui/PageTitle";
import PageActions from "@/components/ui/PageActions";
import Input from "@/components/ui/Input";
import { ClipboardPen, Van, UserRound, Save } from "lucide-react";

type Project = {
  id: number;
  name: string;
};

export default function NewDriverPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [project_id, setProjectId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [status, setStatus] = useState("稼働中");
  const [loading, setLoading] = useState(false);
  const [projectStartDate, setProjectStartDate] = useState("");
  const [fileType, setFileType] = useState("license");

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("name");

      if (!error && data) {
        setProjects(data);
      }
    };

    fetchProjects();
  }, []);
  const saveDriver = async () => {
    if (!name.trim()) {
      alert("氏名を入力してください");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("drivers").insert([
      {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        birth_date: birthDate || null,
        vehicle_type: vehicleType.trim() || null,
        plate_number: plateNumber.trim() || null,
        project_id,
        project_start_date: projectStartDate || null,
        status,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("ドライバーを登録しました");

    router.push("/drivers");
  };

  return (
    <main className="lg:p-4 px-4 pt-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* ヘッダー */}
        <PageTitle>ドライバー追加</PageTitle>
        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900">新規登録</h1>
            <div className="flex gap-3">
              <Button
                variant="update"
                onClick={saveDriver}
                disabled={loading}
                icon={<Save size={18} />}
                className="hidden md:flex "
              >
                {loading ? "保存中..." : "保存する"}
              </Button>
            </div>
          </div>

          {/* 個人情報 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* 個人情報 */}
              <Card className="border border-mist-200">
                <FormSection icon={<UserRound size={24} />} title="個人情報" />
                <Input
                  label="氏名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="電話番号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Input
                  label="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="住所"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <Input
                  type="date"
                  label="生年月日"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </Card>
            </div>

            <div className="space-y-4">
              {/* 車両情報 */}
              <Card className="border border-mist-200">
                <FormSection icon={<Van size={24} />} title="車両情報" />
                <Input
                  label="車種"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                />
                <Input
                  label="ナンバー"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                />
              </Card>

              {/* 案件情報 */}
              <Card className="border border-mist-200">
                <FormSection
                  icon={<ClipboardPen size={24} />}
                  title="案件情報"
                />

                <div className="space-y-1">
                  <label className="text-sm text-slate-500">案件</label>

                  <select
                    className="border border-teal-500 rounded-lg h-12 px-4 py-3.5 w-full text-slate-700"
                    value={project_id ?? ""}
                    onChange={(e) =>
                      setProjectId(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  >
                    <option value="">選択してください</option>

                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  type="date"
                  label="開始日"
                  value={projectStartDate}
                  onChange={(e) => setProjectStartDate(e.target.value)}
                />
              </Card>
            </div>
          </div>
        </Card>
        <div className="w-24">
          <PageActions
            actions={[
              {
                type: "back",
                href: "/drivers",
                label: "戻る",
              },
            ]}
          />
        </div>
        <div className="w-full mx-auto left-0 right-0 fixed bottom-16 bg-teal-50/80 p-4 z-50 block md:hidden">
          <Button
            variant="update"
            onClick={saveDriver}
            disabled={loading}
            icon={<Save size={18} />}
            className="w-full max-w-md mx-auto !flex"
          >
            {loading ? "保存中..." : "保存する"}
          </Button>
        </div>
      </div>
    </main>
  );
}
