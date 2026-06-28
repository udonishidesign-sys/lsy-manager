"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

type DriverFile = {
  id: number;
  driver_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
};

export default function DriverFilesPage() {
  const params = useParams();
  const driverId = Number(params.id);

  const [files, setFiles] = useState<DriverFile[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("license");
  const [loading, setLoading] = useState(false);

  const typeLabel = (type: string) => {
    switch (type) {
      case "license":
        return "免許証";
      case "vehicle":
        return "車検証";
      case "insurance":
        return "任意保険";
      case "contract":
        return "契約書";
      default:
        return "その他";
    }
  };

  const fetchFiles = async () => {
    const { data } = await supabase
      .from("driver_files")
      .select("*")
      .eq("driver_id", driverId)
      .order("created_at", {
        ascending: false,
      });

    setFiles(data ?? []);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const uploadFile = async () => {
    if (!file) {
      alert("ファイルを選択してください");
      return;
    }

    setLoading(true);

    const extension = file.name.split(".").pop();
    const fileName = `${Date.now()}.${extension}`;
    const storagePath = `${driverId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("driver-files")
      .upload(storagePath, file);

    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }

    const { data } = supabase.storage
      .from("driver-files")
      .getPublicUrl(storagePath);

    const { error } = await supabase.from("driver_files").insert([
      {
        driver_id: driverId,
        file_name: file.name,
        file_url: data.publicUrl,
        file_type: fileType,
      },
    ]);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setFile(null);
    fetchFiles();
    setLoading(false);
  };

  const deleteFile = async (fileId: number) => {
    const ok = confirm("削除しますか？");

    if (!ok) return;

    const { error } = await supabase
      .from("driver_files")
      .delete()
      .eq("id", fileId);

    if (error) {
      alert(error.message);
      return;
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <main className="p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-slate-700">添付書類管理</h1>

        {/* アップロード */}
        <div className="bg-white rounded-xl p-4 shadow space-y-4">
          <h2 className="font-semibold text-slate-700">書類追加</h2>

          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="border rounded p-2 w-full text-slate-700"
          >
            <option value="license">免許証</option>
            <option value="vehicle">車検証</option>
            <option value="insurance">任意保険</option>
            <option value="contract">契約書</option>
            <option value="other">その他</option>
          </select>

          <div className="space-y-2">
            <label className="block text-sm text-gray-500">添付ファイル</label>

            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
              <div className="text-center">
                <p className="font-medium text-gray-700">ファイルを選択</p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF・画像をアップロード
                </p>

                {file && (
                  <p className="mt-2 text-sm text-blue-600">{file.name}</p>
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

          <Button onClick={uploadFile} disabled={loading}>
            {loading ? "アップロード中..." : "保存"}
          </Button>
        </div>
        <Button variant="secondary" onClick={() => deleteFile(f.id)}>
          削除
        </Button>

        <Link href={`/drivers/${driverId}`} className="text-blue-500 text-sm">
          ← ドライバー詳細へ戻る
        </Link>
      </div>
    </main>
  );
}
