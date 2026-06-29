"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearDriverSession } from "@/lib/driver-session";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // Supabaseの実セッションを必ず確認する（ローカル値だけで判定しない）
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/report");
        return;
      }

      // セッションが無効なら、古いローカル情報も一緒に消しておく
      clearDriverSession();
      router.replace("/login");
    };

    run();
  }, [router]);

  return <main className="p-4 text-gray-400 text-sm">起動中...</main>;
}
