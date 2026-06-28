"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import PageTitle from "@/components/ui/PageTitle";

type Report = {
  id: number;
  driver_id: number;
  report_date: string;
  delivery_count: number;
  unit_price: number;
  sales: number;
};

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .is("deleted_at", null);

      setReports(data ?? []);
    };

    fetchData();
  }, []);

  // ----------------------------
  // KPI集計
  // ----------------------------
  const totalSales = reports.reduce(
    (sum, r) => sum + (r.delivery_count ?? 0) * (r.unit_price ?? 0),
    0,
  );

  const totalDelivery = reports.reduce(
    (sum, r) => sum + (r.delivery_count ?? 0),
    0,
  );

  const driversCount = new Set(reports.map((r) => r.driver_id)).size;

  const today = new Date().toISOString().split("T")[0];

  const todaySales = reports
    .filter((r) => r.report_date === today)
    .reduce((sum, r) => sum + (r.delivery_count ?? 0) * (r.unit_price ?? 0), 0);
  // ----------------------------
  // UI
  // ----------------------------
  return (
    <main className="p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <PageTitle>管理者ダッシュボード</PageTitle>

        <Card className="space-y-4 md:p-5 px-3 bg-white/50">
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
            <Card className="border border-mist-200">
              <KpiCard
                label="総売上"
                value={`¥${totalSales.toLocaleString()}`}
              />
            </Card>
            <Card className="border border-mist-200">
              <KpiCard
                label="総配送数"
                value={totalDelivery.toLocaleString()}
              />
            </Card>
            <Card className="border border-mist-200">
              <KpiCard label="稼働ドライバー数" value={driversCount} />
            </Card>
            <Card className="border border-mist-200">
              <KpiCard
                label="今日の売上"
                value={`¥${todaySales.toLocaleString()}`}
              />
            </Card>
          </div>

          {/* シンプル分析エリア */}
          <Card className="border border-mist-200">
            <h2 className="font-semibold mb-2 text-slate-700">サマリー</h2>

            <p className="text-sm text-gray-600">
              日報件数：{reports.length}件
            </p>

            <p className="text-sm text-gray-600">
              平均売上： ¥
              {reports.length
                ? Math.round(totalSales / reports.length).toLocaleString()
                : 0}
            </p>
          </Card>
        </Card>
      </div>
    </main>
  );
}

// ----------------------------
// KPIカード
// ----------------------------
function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
