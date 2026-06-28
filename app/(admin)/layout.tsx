"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  ClipboardList,
  CalendarDays,
  BarChart3,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menu = [
    {
      label: "ダッシュボード",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "ドライバー",
      href: "/drivers",
      icon: Users,
    },
    {
      label: "案件管理",
      href: "/projects",
      icon: BriefcaseBusiness,
    },
    {
      label: "日報管理",
      href: "/reports",
      icon: ClipboardList,
    },
    {
      label: "月次集計",
      href: "/drivers/monthly",
      icon: BarChart3,
    },
    {
      label: "シフト管理",
      href: "/shifts",
      icon: CalendarDays,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/drivers") {
      return pathname === "/drivers" || /^\/drivers\/\d/.test(pathname);
    }

    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* SPヘッダー */}
      <header className="lg:hidden bg-slate-700 text-white px-4 py-3 shadow">
        <p className="text-xs text-slate-300">管理システム</p>
        <p className="font-bold text-lg">LSY Manager</p>
      </header>

      <div className="flex">
        {/* PCサイドバー */}
        <aside className="hidden lg:flex w-64 min-h-screen bg-slate-700 flex-col">
          <div className="p-6 border-b border-slate-600">
            <p className="text-xs text-slate-300">管理システム</p>

            <h1 className="text-xl font-bold text-white mt-1">LSY Manager</h1>
          </div>

          <nav className="p-3 space-y-1">
            {menu.map((item) => {
              const active = isActive(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3
                    px-4 py-3 rounded-lg
                    transition
                    ${
                      active
                        ? "bg-white text-slate-700 font-semibold"
                        : "text-slate-200 hover:bg-slate-600"
                    }
                  `}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* メイン */}
        <div className="flex-1 min-w-0">
          {/* PCヘッダー */}
          <header className="hidden lg:flex bg-white border-b px-6 py-4 items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">管理者用</p>

              <p className="font-semibold text-slate-700">LSY エルシステム</p>
            </div>
          </header>

          {/* コンテンツ */}

          {children}
        </div>
      </div>

      {/* SP下部ナビ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow">
        <div className="grid grid-cols-6 h-16">
          {menu.map((item) => {
            const active = isActive(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center
                  text-xs
                  ${active ? "text-teal-600" : "text-slate-500"}
                `}
              >
                <Icon size={20} />
                <span className="mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
