"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearDriverSession } from "@/lib/driver-session";

export default function Page() {
  const router = useRouter();
  const decided = useRef(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (decided.current) return;
        decided.current = true;

        if (session) {
          router.replace("/report");
        } else {
          clearDriverSession();
          router.replace("/login");
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return <main className="p-4 text-gray-400 text-sm">起動中...</main>;
}
