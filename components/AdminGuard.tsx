"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.replace("/admin-login");
        return;
      }

      const { data, error } = await supabase.rpc("is_admin");

      if (!mounted) return;

      if (error) {
        console.error("管理者権限の確認エラー:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        router.replace("/report");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-400">管理者権限を確認中...</div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
