"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import DriverName from "@/components/ui/DriverName";
import { supabase } from "@/lib/supabase";
import { getDriverSessionId } from "@/lib/driver-session";

import { House, ClipboardPen, History, ClipboardCheck } from "lucide-react";

const menu = [
  {
    href: "/test/report",
    label: "ホーム",
    icon: House,
  },
  {
    href: "/test/report/check",
    label: "点検",
    icon: ClipboardCheck,
  },
  {
    href: "/test/report/new",
    label: "日報",
    icon: ClipboardPen,
  },
  {
    href: "/test/report/history",
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

  const [driverName, setDriverName] = useState("");
  const [isShein, setIsShein] = useState(false);
  const [isCSOsakaTech, setIsCSOsakaTech] = useState(false);
  const [canOpenReport, setCanOpenReport] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const loadDriver = async () => {
      const id = getDriverSessionId();

      if (!id) {
        setDriverName("");
        setSelectedProjectId(null);
        setIsShein(false);
        setIsCSOsakaTech(false);
        return;
      }

      // ドライバー情報
      const { data: driver } = await supabase
        .from("drivers")
        .select("name")
        .eq("id", id)
        .single();

      if (driver) setDriverName(driver.name);

      // 今日の日付
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      // ホーム画面で選択した案件を取得
      const storageKey = `report-selected-project:${id}:${today}`;
      const storedProjectId = Number(localStorage.getItem(storageKey)) || null;

      setSelectedProjectId(storedProjectId);

      // 今日の日報を取得// 今日の日報を取得
      const { data: report } = await supabase
        .from("daily_reports")
        .select("project_id")
        .eq("driver_id", id)
        .eq("report_date", today)
        .is("deleted_at", null)
        .maybeSingle();

      // 今日の日報が保存済みの場合のみ、保存済み案件を優先
      // 未保存の場合はホーム画面で最後に選択した案件を使用
      const projectId = report?.project_id ?? storedProjectId ?? null;

      setSelectedProjectId(projectId);

      if (projectId) {
        const { data: project } = await supabase
          .from("projects")
          .select("id, name, requires_vehicle_check")
          .eq("id", projectId)
          .maybeSingle();

        const shein = project?.name === "SHEIN";
        setIsShein(shein);
        const csosakatech = project?.name === "CS大阪テック";
        setIsCSOsakaTech(csosakatech);

        const [reportResult, checkResult] = await Promise.all([
          supabase
            .from("daily_reports")
            .select("id, project_id")
            .eq("driver_id", id)
            .eq("report_date", today)
            .eq("project_id", projectId)
            .is("deleted_at", null)
            .maybeSingle(),

          supabase
            .from("driver_vehicle_checks")
            .select("check_date")
            .eq("driver_id", id)
            .eq("check_date", today)
            .maybeSingle(),
        ]);

        const requiresCheck = project?.requires_vehicle_check ?? false;
        const reportDone = !!reportResult.data;
        const checkDone = !!checkResult.data;

        setCanOpenReport(
          shein || csosakatech || !requiresCheck || checkDone || reportDone,
        );
      } else {
        setIsShein(false);
        setIsCSOsakaTech(false);
        setCanOpenReport(false);
      }
    };
    void loadDriver();
    window.addEventListener("driver-session-updated", loadDriver);

    return () => {
      window.removeEventListener("driver-session-updated", loadDriver);
    };
  }, []);

  return (
    <div className="min-h-screen bg-mist-200">
      <header className="no-print max-w-md mx-auto bg-white/95 backdrop-blur text-mist-700 px-4 pb-3 pt-2 border-b border-mist-200 fixed w-full z-10 left-0 right-0 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-teal-600">
              LSY DRIVER PORTAL
            </p>
            <p className="font-bold text-lg text-mist-700 leading-tight">
              ドライバー管理
            </p>
          </div>

          <DriverName name={driverName} />
        </div>
      </header>

      {children}

      <nav className="no-print fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm mx-auto max-w-md z-[100]">
        <div
          className={`grid ${isShein || isCSOsakaTech ? "grid-cols-3" : "grid-cols-4"} h-16`}
        >
          {menu
            .filter(
              (item) =>
                !(
                  (isShein || isCSOsakaTech) &&
                  item.href === "/test/report/check"
                ),
            )

            .map((item) => {
              const Icon = item.icon;

              const active =
                item.href === "/test/report"
                  ? pathname === "/test/report"
                  : pathname.startsWith(item.href);

              const href =
                item.href === "/test/report/check" ||
                item.href === "/test/report/new"
                  ? selectedProjectId
                    ? `${item.href}?project_id=${selectedProjectId}`
                    : item.href
                  : item.href;

              return (
                <Link
                  key={item.href}
                  href={href}
                  aria-disabled={
                    (item.href === "/test/report/new" && !canOpenReport) ||
                    (item.href === "/test/report/check" && !selectedProjectId)
                  }
                  onClick={(e) => {
                    if (
                      (item.href === "/test/report/new" && !canOpenReport) ||
                      (item.href === "/test/report/check" && !selectedProjectId)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className={`flex flex-col items-center justify-center text-xs transition text-mist-600 ${
                    (item.href === "/test/report/new" && !canOpenReport) ||
                    (item.href === "/test/report/check" && !selectedProjectId)
                      ? "opacity-40 cursor-not-allowed"
                      : active
                        ? "text-teal-600 font-semibold"
                        : "text-mist-500"
                  }`}
                >
                  <Icon
                    size={20}
                    className={active ? "text-teal-600" : "text-mist-500"}
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
