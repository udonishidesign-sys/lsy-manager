"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setReady(true);
    };

    check();
  }, [router]);

  if (!ready) {
    return <div className="p-4 text-gray-400 text-sm">読み込み中...</div>;
  }

  return <>{children}</>;
}
