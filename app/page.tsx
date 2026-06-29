"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getDriverSessionId } from "@/lib/driver-session";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // ① ローカル即判定（PWA対策）
      const local = getDriverSessionId();

      if (local) {
        router.replace("/report");
        return;
      }

      // ② Supabaseセッション（フォールバック）
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/report");
      } else {
        router.replace("/login");
      }
    };

    run();
  }, [router]);

  return <main className="p-4 text-gray-400 text-sm">起動中...</main>;
}
