"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDriverSessionId } from "@/lib/driver-session";
import Button from "@/components/ui/Button";
import PageTitle from "@/components/ui/PageTitle";

type Driver = {
  id: number;
  name: string;
};

export default function UploadPage() {
  const router = useRouter();
  const [driverName, setDriverName] = useState("");
  const [driverId, setDriverId] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("配送実績");
  const [loading, setLoading] = useState(false);
  const uploadFile = async () => {
    const driverId = getDriverSessionId();
    if (!driverId) {
      alert("ログインしてください");
      return;
    }
    if (!file) {
      alert("ファイルを選択してください");
      return;
    }
    setLoading(true);
    const fileName = `${driverId}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("report-files")
      .upload(fileName, file);
    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }
    const { data } = supabase.storage
      .from("report-files")
      .getPublicUrl(fileName);
    const { error } = await supabase.from("report_files").insert([
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

    alert("アップロードしました");

    setFile(null);
    setLoading(false);
  };

  useEffect(() => {
    const id = getDriverSessionId();

    if (!id) {
      router.push("/login");
      return;
    }

    setDriverId(id);
    const driver = drivers.find((d) => d.id === id);

    if (driver) {
      setDriverName(driver.name);
    }
  }, [drivers, router]);

  if (!driverId)
    return (
      <main className="p-4">
        <p>driverId がありません</p>
      </main>
    );

  return (
    <main className="px-4 pt-24 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <PageTitle>ファイル提出</PageTitle>
        <div className="bg-white rounded-xl shadow p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">種類</label>

            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="border rounded w-full py-2.5 px-2 bg-teal-50 border-teal-500 text-slate-700 outline-none"
            >
              <option>配送実績</option>
              <option>請求書</option>
              <option>伝票</option>
              <option>事故報告</option>
              <option>その他</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-500 mb-1">
              添付ファイル
            </label>

            <label className="flex items-center justify-center w-full h-32 border-1 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition bg-teal-50">
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
        </div>
        <Button className="w-full" onClick={uploadFile} disabled={loading}>
          {loading ? "アップロード中..." : "保存"}
        </Button>
      </div>
    </main>
  );
}
