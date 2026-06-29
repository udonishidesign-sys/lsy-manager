"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(data.session);
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // 👉 ここが重要：判定中は何もしない
  if (loading) {
    return <div className="p-4 text-sm text-gray-400">確認中...</div>;
  }

  // 👉 未ログインは表示だけ変える（redirectしない）
  if (!session) {
    return (
      <div className="p-4 text-sm text-gray-400">ログインしてください</div>
    );
  }

  return <>{children}</>;
}
