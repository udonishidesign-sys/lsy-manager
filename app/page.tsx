"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getDriverSessionId } from "@/lib/driver-session";
import SplashScreen from "@/components/SplashScreen";

export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      // スプラッシュ最低表示時間（UX用）
      const wait = new Promise((r) => setTimeout(r, 800));

      const localId = getDriverSessionId();

      const { data } = await supabase.auth.getSession();

      await wait;

      if (localId || data.session) {
        router.replace("/report");
      } else {
        router.replace("/login");
      }

      setReady(true);
    };

    check();
  }, [router]);

  return <SplashScreen />;
}
