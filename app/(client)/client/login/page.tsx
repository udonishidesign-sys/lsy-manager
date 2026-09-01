"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        console.error(loginError);
        setError("メールアドレスまたはパスワードが正しくありません。");
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("ログイン情報を取得できませんでした。");
        setLoading(false);
        return;
      }

      /*
       * ログインしたユーザーのメールアドレスから
       * 受託先情報を確認
       */
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", data.user.email)
        .maybeSingle();

      if (clientError) {
        console.error(clientError);
        await supabase.auth.signOut();
        setError("受託先情報の確認に失敗しました。");
        setLoading(false);
        return;
      }

      if (!client) {
        await supabase.auth.signOut();
        setError("受託先として登録されていないアカウントです。");
        setLoading(false);
        return;
      }

      router.push("/client");
      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "ログインに失敗しました。",
      );

      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              受託先ログイン
            </h1>

            <p className="mt-2 text-sm text-slate-500">日報管理システム</p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                メールアドレス
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                placeholder="example@example.com"
                className="w-full h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                パスワード
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                placeholder="パスワード"
                className="w-full h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600 whitespace-pre-wrap">
                  {error}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 rounded-lg bg-teal-500 text-white font-bold transition hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
