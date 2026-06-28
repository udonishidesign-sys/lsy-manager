"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getDriverSessionId } from "@/lib/driver-session";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      // ① まずローカルセッションを見る（即時）
      const driverId = getDriverSessionId();

      if (driverId) {
        router.replace("/report");
        return;
      }

      // ② Supabaseセッション確認（遅延OK）
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/report");
      } else {
        router.replace("/login");
      }
    };

    check();

    // ③ 状態変化監視（残す）
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session || getDriverSessionId()) {
          router.replace("/report");
        } else {
          router.replace("/login");
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
