"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getDriverSessionId } from "@/lib/driver-session";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const driverId = getDriverSessionId();
      const { data } = await supabase.auth.getSession();

      if (!data.session && !driverId) {
        router.replace("/login");
        return;
      }

      setChecking(false);
    };

    check();
  }, [router]);

  if (checking) {
    return <main className="p-4 text-gray-400 text-xs">読み込み中...</main>;
  }

  return <>{children}</>;
}
