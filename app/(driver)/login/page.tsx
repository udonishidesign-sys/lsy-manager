"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const login = async () => {
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (!data.session) {
      setError("ログインに失敗しました");
      return;
    }

    router.push("/report");
  };

  return (
    <main className="p-4">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-xl font-bold text-gray-500">ドライバーログイン</h1>

        {/* email */}
        <input
          className="border border-gray-300 p-2 w-full rounded text-gray-500"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* password */}
        <input
          className="border border-gray-300 p-2 w-full rounded text-gray-500"
          placeholder="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button onClick={login} disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </Button>
      </div>
    </main>
  );
}
