"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Card from "@/components/ui/Card";
import PageTitle from "@/components/ui/PageTitle";
import PageActions from "@/components/ui/PageActions";
import Input from "@/components/ui/Input";
import {
  ClipboardPen,
  Eye,
  Van,
  FileText,
  UserRound,
  CircleCheckBig,
  Upload,
  Save,
} from "lucide-react";

type Driver = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  birth_date?: string;
  vehicle_type?: string;
  plate_number?: string;
  project?: string;
  project_start_date?: string;
  project_id: number;
  status: "稼働中" | "休職中" | "退職";
};

type DriverFile = {
  id: number;
  driver_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
};
type Project = {
  id: number;
  name: string;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export default function EditDriver() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState("license");
  const [files, setFiles] = useState<DriverFile[]>([]);

  useEffect(() => {
    const fetchDriver = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setLoaded(true);
        return;
      }
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name");

      const { data: filesData } = await supabase
        .from("driver_files")
        .select("*")
        .eq("driver_id", id);

      setDriver(data);
      setLoaded(true);
      setProjects(projectsData ?? []);
      setFiles(filesData ?? []);
    };

    fetchDriver();
  }, [id]);

  const uploadFile = async () => {
    if (!file) {
      console.log("fileなし");
      return;
    }

    console.log("開始");

    setLoading(true);

    try {
      const fileExt = file.name.split(".").pop();

      const fileName = `${driver?.id}_${Date.now()}.${fileExt}`;

      const filePath = `drivers/${fileName}`;

      console.log("upload前", filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("driver-files")
        .upload(filePath, file);

      console.log("upload結果", uploadData, uploadError);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("driver-files")
        .getPublicUrl(filePath);

      console.log("publicUrl", publicData.publicUrl);

      const { data: insertData, error: insertError } = await supabase
        .from("driver_files")
        .insert({
          driver_id: id,
          file_name: file.name,
          file_url: publicData.publicUrl,
          file_type: fileType,
        })
        .select();

      console.log("insert結果", insertData, insertError);

      if (insertError) throw insertError;

      alert("アップロードしました");
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const deleteFile = async (id: number) => {
    const ok = confirm("このファイルを削除しますか？");
    if (!ok) return;

    const { error } = await supabase.from("driver_files").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setFiles((prev) => prev.filter((f) => f.id !== id));

    alert("削除しました");
  };

  const update = <K extends keyof Driver>(key: K, value: Driver[K]) => {
    setDriver((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const save = async () => {
    if (!driver) return;
    const { error } = await supabase
      .from("drivers")
      .update({
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        address: driver.address,
        birth_date: birthDate || null,
        vehicle_type: driver.vehicle_type,
        plate_number: driver.plate_number,
        project_id: driver.project_id,
        project_start_date: driver.project_start_date,
        status: driver.status,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/drivers/${id}`);
  };

  if (!loaded) return null;
  if (!driver) return <p className="p-6">存在しません</p>;

  return (
    <main className="p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* ヘッダー */}
        <PageTitle>ドライバー編集</PageTitle>
        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300">ドライバーID #{driver.id}</p>
              <h1 className="text-3xl font-bold text-slate-900">
                {driver.name}
              </h1>
            </div>
            <div className="flex gap-3 hidden md:block">
              <Button variant="save" onClick={save} showIcon>
                保存する
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
                  label="電話番号"
                  value={driver.phone || ""}
                  onChange={(e) => update("phone", e.target.value)}
                />
                <Input
                  label="メールアドレス"
                  value={driver.email || ""}
                  onChange={(e) => update("email", e.target.value)}
                />
                <Input
                  label="住所"
                  value={driver.address || ""}
                  onChange={(e) => update("address", e.target.value)}
                />
                <Input
                  type="date"
                  label="生年月日"
                  value={driver.birth_date || ""}
                  onChange={(e) => update("birth_date", e.target.value)}
                />
              </Card>

              {/* ステータス */}
              <Card className="border border-mist-200">
                <FormSection
                  icon={<CircleCheckBig size={24} />}
                  title="ステータス"
                />
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => update("status", "稼働中")}
                    className={`rounded-lg p-3 font-semibold transition cursor-pointer ${
                      driver.status === "稼働中"
                        ? "bg-teal-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    稼働中
                  </button>
                  <button
                    type="button"
                    onClick={() => update("status", "休職中")}
                    className={`rounded-lg p-3 font-semibold transition cursor-pointer ${
                      driver.status === "休職中"
                        ? "bg-yellow-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    休職中
                  </button>
                  <button
                    type="button"
                    onClick={() => update("status", "退職")}
                    className={`rounded-lg p-3 font-semibold transition cursor-pointer ${
                      driver.status === "退職"
                        ? "bg-red-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    退職
                  </button>
                </div>
              </Card>
              {/* 車両情報 */}
              <Card className="border border-mist-200">
                <FormSection icon={<Van size={24} />} title="車両情報" />
                <Input
                  label="車種"
                  value={driver.vehicle_type || ""}
                  onChange={(e) => update("vehicle_type", e.target.value)}
                />
                <Input
                  label="ナンバー"
                  value={driver.plate_number || ""}
                  onChange={(e) => update("plate_number", e.target.value)}
                />
              </Card>
            </div>

            <div className="space-y-4">
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
                    value={driver.project_id ?? ""}
                    onChange={(e) =>
                      update("project_id", Number(e.target.value))
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
                  value={driver.project_start_date || ""}
                  onChange={(e) => update("project_start_date", e.target.value)}
                />
              </Card>

              <Card className="border border-mist-200">
                <FormSection
                  icon={<FileText size={24} />}
                  title="登録済み書類"
                />
                {files.length === 0 ? (
                  <div className="p-4 text-gray-500 text-slate-700">
                    書類はありません
                  </div>
                ) : (
                  files.map((f) => (
                    <div key={f.id} className="divide-y">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-700">
                            {f.file_type}
                          </p>

                          <p className="text-sm text-gray-500 text-slate-700">
                            {f.file_name}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <PageActions
                            actions={[
                              {
                                type: "detail",
                                href: f.file_url,
                                target: "_blank",
                                label: "",
                                icon: <Eye size={20} />,
                              },
                            ]}
                          />
                          <Button
                            variant="delete"
                            iconOnly
                            onClick={() => deleteFile(f.id)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Card>
              <Card className="border border-mist-200">
                <FormSection icon={<Upload size={24} />} title="書類登録" />
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm text-gray-500">種類</label>
                    <select
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                      className="border border-teal-500 rounded-lg px-4 h-12 py-3.5 w-full text-slate-700"
                    >
                      <option value="license">免許証</option>
                      <option value="vehicle">車検証</option>
                      <option value="insurance">任意保険</option>
                      <option value="contract">契約書</option>
                      <option value="other">その他</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-500">
                      添付ファイル
                    </label>

                    <label className="flex items-center justify-center w-full h-32 border-1 border-dashed border-gray-300 bg-teal-50 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                      <div className="text-center">
                        <p className="font-medium text-gray-700">
                          ファイルを選択
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF・画像をアップロード
                        </p>
                        {file && (
                          <p className="mt-2 text-sm text-blue-600">
                            {file.name}
                          </p>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <Button
                    onClick={() => {
                      uploadFile();
                    }}
                    showIcon
                    variant="save"
                  >
                    ファイルを保存
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </Card>
        <div className="w-full mx-auto left-0 right-0 fixed bottom-16 bg-teal-50/80 p-4 z-50 block md:hidden">
          <Button
            variant="update"
            onClick={save}
            disabled={loading}
            icon={<Save size={18} />}
            className="w-full max-w-md mx-auto !flex"
          >
            {loading ? "保存中..." : "保存する"}
          </Button>
        </div>
        <div className="w-24">
          <PageActions
            actions={[
              {
                type: "back",
                href: `/drivers/${id}`,
                label: "戻る",
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
