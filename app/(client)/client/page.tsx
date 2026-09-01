"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserRound, ChevronRight } from "lucide-react";

type Driver = {
  id: number;
  name: string;
};

export default function ClientHomePage() {
  const router = useRouter();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDrivers = async () => {
      setLoading(true);
      setError("");

      // ログイン中の受託先を取得
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/client/login");
        return;
      }

      // clients テーブルからログイン中の受託先を取得
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", session.user.email)
        .single();

      if (clientError || !client) {
        console.error(clientError);
        router.push("/client/login");
        return;
      }

      // その受託先に紐づいているドライバーを取得
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("id, name")
        .eq("client_id", client.id)
        .order("name", { ascending: true });

      if (driverError) {
        console.error(driverError);
        setError("ドライバー情報を取得できませんでした。");
        setLoading(false);
        return;
      }

      setDrivers(driverData ?? []);
      setLoading(false);
    };

    loadDrivers();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 pt-24">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ドライバーを選択
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            日報を確認するドライバーを選択してください。
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {drivers.length === 0 && !error ? (
          <div className="rounded-lg bg-slate-50 p-6 text-center">
            <p className="text-sm text-gray-500">
              紐づいているドライバーがありません。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <button
                key={driver.id}
                type="button"
                onClick={() =>
                  router.push(`/client/drivers/${driver.id}/reports`)
                }
                className="w-full flex items-center justify-between bg-white border border-mist-200 rounded-xl p-5 shadow-sm hover:border-teal-500 hover:bg-teal-50 transition hover:cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center">
                    <UserRound size={24} className="text-teal-600" />
                  </div>

                  <span className="text-lg font-bold text-slate-800">
                    {driver.name}
                  </span>
                </div>

                <ChevronRight size={24} className="text-teal-500" />
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
