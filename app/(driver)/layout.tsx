"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import DriverName from "@/components/ui/DriverName";
import { supabase } from "@/lib/supabase";
import { getDriverSessionId } from "@/lib/driver-session";

import {
  House,
  ClipboardPen,
  Upload,
  History,
} from "lucide-react";

const menu = [
  {
    href: "/report",
    label: "ホーム",
    icon: House,
  },
  {
    href: "/report/new",
    label: "日報",
    icon: ClipboardPen,
  },
  {
    href: "/report/upload",
    label: "ファイル",
    icon: Upload,
  },
  {
    href: "/report/history",
    label: "日報履歴",
    icon: History,
  },
];

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [driverName, setDriverName] =
    useState("");

  useEffect(() => {
    const loadDriver = async () => {
      const id = getDriverSessionId();

      if (!id) return;

      const { data } = await supabase
        .from("drivers")
        .select("name")
        .eq("id", id)
        .single();

      if (data) {
        setDriverName(data.name);
      }
    };

    loadDriver();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-700 max-w-md mx-auto text-white px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-200">
              ドライバー用
            </p>
            <p className="font-bold text-lg">
              LSY 日報
            </p>
          </div>

          <DriverName name={driverName} />
        </div>
      </header>

      {children}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm mx-auto max-w-md z-[100]">
        <div className="grid grid-cols-4 h-16">
          {menu.map((item) => {
            const Icon = item.icon;

            const active =
  item.href === "/report"
    ? pathname === "/report"
    : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center text-xs transition ${
                  active
                    ? "text-teal-600 font-semibold"
                    : "text-slate-500"
                }`}
              >
                <Icon
                  size={20}
                  className={
                    active
                      ? "text-teal-600"
                      : "text-slate-500"
                  }
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}