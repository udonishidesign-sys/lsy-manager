"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
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

    if (error || !data.session) {
      setLoading(false);
      setError("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

    if (adminError || !isAdmin) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("管理者権限がありません");
      return;
    }

    setLoading(false);
    router.replace("/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 space-y-5">
        <div>
          <p className="text-sm text-gray-400">LSY エルシステム</p>
          <h1 className="text-2xl font-bold text-slate-700 mt-2">
            管理者ログイン
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            管理者アカウントでログインしてください。
          </p>
        </div>

        <Input
          label="メールアドレス"
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="パスワード"
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={login} disabled={loading} className="w-full">
          {loading ? "ログイン中..." : "ログイン"}
        </Button>
      </div>
    </main>
  );
}
