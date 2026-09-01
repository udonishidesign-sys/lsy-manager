"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ClientPasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /*
   * ========================================
   * パスワード変更処理
   * ========================================
   */
  const handleChangePassword = async () => {
    if (loading) return;

    setError("");
    setSuccess(false);

    /*
     * -----------------------------
     * 入力チェック
     * -----------------------------
     */

    if (!currentPassword) {
      setError("現在のパスワードを入力してください。");
      return;
    }

    if (!newPassword) {
      setError("新しいパスワードを入力してください。");
      return;
    }

    if (newPassword.length < 8) {
      setError("新しいパスワードは8文字以上で設定してください。");
      return;
    }

    if (!confirmPassword) {
      setError("新しいパスワード（確認）を入力してください。");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("新しいパスワードと確認用パスワードが一致していません。");
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "新しいパスワードは現在のパスワードと異なるものを設定してください。",
      );
      return;
    }

    setLoading(true);

    /*
     * ========================================
     * ログイン中のユーザーを取得
     * ========================================
     */

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.email) {
      console.error(sessionError);

      router.replace("/client/login");
      return;
    }

    const email = session.user.email;

    /*
     * ========================================
     * 現在のパスワードを確認
     *
     * Supabase Authでは、
     * 現在のパスワードを直接照合するAPIがないため、
     * signInWithPassword() で確認する。
     * ========================================
     */

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      console.error(signInError);

      setError("現在のパスワードが正しくありません。");
      setLoading(false);
      return;
    }

    /*
     * ========================================
     * 新しいパスワードへ変更
     * ========================================
     */

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error(updateError);

      setError(
        "パスワードの変更に失敗しました。時間をおいてもう一度お試しください。",
      );
      setLoading(false);
      return;
    }

    /*
     * ========================================
     * 成功
     * ========================================
     */

    setSuccess(true);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setLoading(false);
  };

  /*
   * ========================================
   * Enterキー対応
   * ========================================
   */

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleChangePassword();
    }
  };

  /*
   * ========================================
   * パスワード入力欄
   * ========================================
   */

  const PasswordInput = ({
    label,
    value,
    onChange,
    placeholder,
    show,
    setShow,
    onKeyDown,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    show: boolean;
    setShow: (value: boolean) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  }) => {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>

        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoComplete="new-password"
            className="w-full h-12 rounded-lg border border-gray-300 bg-white px-4 pr-12 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />

          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:cursor-pointer"
            aria-label={show ? "パスワードを隠す" : "パスワードを表示"}
          >
            {show ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>
    );
  };

  /*
   * ========================================
   * 画面
   * ========================================
   */

  return (
    <main className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="max-w-md mx-auto">
        {/* ========================================
            ヘッダー
        ======================================== */}

        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/client/account")}
            className="flex items-center gap-1 text-sm text-teal-600 mb-4 hover:cursor-pointer"
          >
            <ChevronLeft size={18} />
            アカウント設定
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center">
              <LockKeyhole size={23} className="text-teal-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                パスワード変更
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                ログイン用パスワードを変更します。
              </p>
            </div>
          </div>
        </div>

        {/* ========================================
            成功メッセージ
        ======================================== */}

        {success && (
          <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={21}
                className="text-teal-600 shrink-0 mt-0.5"
              />

              <div>
                <p className="text-sm font-bold text-teal-700">
                  パスワードを変更しました
                </p>

                <p className="text-xs text-teal-600 mt-1">
                  次回のログインから新しいパスワードをご利用ください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================
            エラーメッセージ
        ======================================== */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />

              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* ========================================
            パスワード変更フォーム
        ======================================== */}

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="space-y-5">
            {/* 現在のパスワード */}

            <PasswordInput
              label="現在のパスワード"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="現在のパスワードを入力"
              show={showCurrent}
              setShow={setShowCurrent}
              onKeyDown={handleKeyDown}
            />

            {/* 区切り */}

            <div className="border-t border-gray-100 pt-5">
              <PasswordInput
                label="新しいパスワード"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="8文字以上"
                show={showNew}
                setShow={setShowNew}
                onKeyDown={handleKeyDown}
              />

              <p className="text-xs text-gray-400 mt-2">
                8文字以上のパスワードを設定してください。
              </p>
            </div>

            {/* 確認 */}

            <PasswordInput
              label="新しいパスワード（確認）"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="もう一度入力してください"
              show={showConfirm}
              setShow={setShowConfirm}
              onKeyDown={handleKeyDown}
            />

            {/* 変更ボタン */}

            <button
              type="button"
              onClick={handleChangePassword}
              disabled={loading}
              className="w-full h-12 rounded-lg bg-teal-500 text-white font-bold hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {loading ? "変更しています..." : "パスワードを変更する"}
            </button>
          </div>
        </div>

        {/* ========================================
            注意事項
        ======================================== */}

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-600 mb-2">
            パスワードについて
          </p>

          <ul className="space-y-1 text-xs text-gray-500">
            <li>・8文字以上で設定してください。</li>
            <li>・他のサービスと同じパスワードは避けてください。</li>
            <li>・変更後は新しいパスワードでログインしてください。</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
