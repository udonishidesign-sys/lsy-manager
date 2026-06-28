"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { setDriverSessionId } from "@/lib/driver-session";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const login = async () => {
    setError("");

    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      setError("該当するドライバーが見つかりません");
      return;
    }

    setDriverSessionId(data.id);

    router.push("/report"); // 日報画面へ
  };

  return (
    <main className="p-4">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-xl font-bold text-gray-500">ドライバーログイン</h1>

        <input
          className="border border-gray-300 p-2 w-full rounded text-gray-500"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <Button
          onClick={login}
        >
          ログイン
        </Button>
      </div>
    </main>
  );
}