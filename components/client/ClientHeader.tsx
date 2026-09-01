"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Menu, X, UserRound, LogOut, LockKeyhole } from "lucide-react";

type Client = {
  id: number;
  name: string | null;
  email: string | null;
};

export default function ClientHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const [client, setClient] = useState<Client | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadClient = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/client/login");
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email")
        .eq("email", session.user.email)
        .single();

      if (error || !data) {
        console.error(error);
        router.replace("/client/login");
        return;
      }

      setClient(data);
    };

    loadClient();
  }, [router]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      setLoggingOut(false);
      return;
    }

    router.replace("/client/login");
  };

  const closeMenu = () => {
    setOpen(false);
  };

  const goToAccount = () => {
    closeMenu();
    router.push("/client/account");
  };

  const goToPassword = () => {
    closeMenu();
    router.push("/client/account/password");
  };

  const isAccountPage = pathname?.startsWith("/client/account");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* ロゴ・サービス名 */}
          <button
            type="button"
            onClick={() => router.push("/client")}
            className="font-bold text-lg text-slate-900 hover:cursor-pointer"
          >
            LSY
          </button>

          {/* PC */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={goToAccount}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition hover:cursor-pointer ${
                isAccountPage
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-gray-50"
              }`}
            >
              <UserRound size={18} />

              <span className="text-sm font-medium">
                {client?.name || client?.email || "アカウント"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-red-500 disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed"
            >
              <LogOut size={18} />
              {loggingOut ? "ログアウト中..." : "ログアウト"}
            </button>
          </div>

          {/* スマホ */}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-gray-100 hover:cursor-pointer"
            aria-label="メニュー"
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* スマホメニュー */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-3">
            <div className="px-2 pb-3">
              <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <UserRound size={20} className="text-teal-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {client?.name || "受託先"}
                  </p>

                  <p className="text-xs text-gray-500 truncate">
                    {client?.email || ""}
                  </p>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                type="button"
                onClick={goToAccount}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm text-slate-700 hover:bg-gray-50 hover:cursor-pointer"
              >
                <UserRound size={19} className="text-teal-600" />
                アカウント設定
              </button>

              {/*<button
                type="button"
                onClick={goToPassword}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm text-slate-700 hover:bg-gray-50 hover:cursor-pointer"
              >
                <LockKeyhole size={19} className="text-teal-600" />
                パスワード変更
              </button>*/}

              <div className="border-t border-gray-100 my-2" />

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm text-red-500 hover:bg-red-50 disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed"
              >
                <LogOut size={19} />
                {loggingOut ? "ログアウト中..." : "ログアウト"}
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
