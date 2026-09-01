"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  UserRound,
  Mail,
  LockKeyhole,
  LogOut,
  ChevronRight,
} from "lucide-react";

type Client = {
  id: number;
  name: string | null;
  email: string | null;
};

export default function ClientAccountPage() {
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadClient = async () => {
      setLoading(true);
      setError("");

      // =========================================================
      // ログイン確認
      // =========================================================

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/client/login");
        return;
      }

      // =========================================================
      // ログイン中の受託先を取得
      //
      // Supabase Auth のメールアドレス
      // ↓
      // clients.email と照合
      // =========================================================

      const { data, error: clientError } = await supabase
        .from("clients")
        .select("id, name, email")
        .eq("email", session.user.email)
        .single();

      if (clientError || !data) {
        console.error(clientError);

        router.replace("/client/login");
        return;
      }

      setClient(data);
      setLoading(false);
    };

    loadClient();
  }, [router]);

  // =========================================================
  // ログアウト
  // =========================================================

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      console.error(logoutError);

      setError("ログアウトに失敗しました。");
      setLoggingOut(false);
      return;
    }

    router.replace("/client/login");
  };

  // =========================================================
  // 読み込み中
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 pt-24 pb-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </main>
    );
  }

  // =========================================================
  // エラー
  // =========================================================

  if (error || !client) {
    return (
      <main className="min-h-screen bg-white px-4 pt-24 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl bg-red-50 border border-red-200 p-5">
            <p className="text-sm text-red-600">
              {error || "アカウント情報を取得できませんでした。"}
            </p>

            <button
              type="button"
              onClick={() => router.replace("/client/login")}
              className="mt-4 px-4 py-2 rounded-lg bg-teal-500 text-white font-bold hover:cursor-pointer"
            >
              ログイン画面へ
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* =====================================================
            ページタイトル
        ====================================================== */}

        <div>
          <h1 className="text-2xl font-bold text-slate-900">アカウント情報</h1>

          {/*<p className="text-sm text-gray-500 mt-2">
            アカウント情報やパスワードを管理できます。
          </p>*/}
        </div>

        {/* =====================================================
            アカウント情報
        ====================================================== */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* セクションタイトル */}

          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <UserRound size={20} className="text-teal-500" />

              <h2 className="font-bold text-slate-800">アカウント</h2>
            </div>
          </div>

          {/* アカウント情報 */}

          <div className="px-5">
            {/* 受託先名 */}

            <div className="flex items-center justify-between gap-4 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                  <UserRound size={19} className="text-teal-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-1">受託先名</p>

                  <p className="text-sm font-bold text-slate-800 break-words">
                    {client.name || "未登録"}
                  </p>
                </div>
              </div>
            </div>

            {/* メールアドレス */}

            <div className="flex items-center justify-between gap-4 py-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                  <Mail size={19} className="text-teal-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-1">メールアドレス</p>

                  <p className="text-sm font-bold text-slate-800 break-all">
                    {client.email || "未登録"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            セキュリティ
        ====================================================== 

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* セクションタイトル 

          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <LockKeyhole size={20} className="text-teal-500" />

              <h2 className="font-bold text-slate-800">セキュリティ</h2>
            </div>
          </div>

          {/* パスワード変更 

          <button
            type="button"
            onClick={() => router.push("/client/account/password")}
            className="w-full flex items-center justify-between gap-4 px-5 py-5 text-left hover:bg-gray-50 transition hover:cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <LockKeyhole size={19} className="text-teal-600" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  パスワード変更
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  ログインパスワードを変更します
                </p>
              </div>
            </div>

            <ChevronRight size={20} className="text-gray-400 shrink-0" />
          </button>
        </section>*/}

        {/* =====================================================
            ログアウト
        ====================================================== */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-5 py-5 text-left text-red-500 hover:bg-red-50 transition disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <LogOut size={19} />
            </div>

            <div>
              <p className="text-sm font-bold">
                {loggingOut ? "ログアウト中..." : "ログアウト"}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                このアカウントからログアウトします
              </p>
            </div>
          </button>
        </section>

        {/* =====================================================
            エラー表示
        ====================================================== */}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
