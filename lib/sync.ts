import { loadDrivers, saveDrivers } from "./drivers";
import { loadReports } from "./reports";

function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function syncDriverStatsFromReports(driverId?: number): void {
  const reports = loadReports();
  const drivers = loadDrivers();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const targetIds =
    driverId !== undefined ? [driverId] : drivers.map((_, i) => i);

  for (const id of targetIds) {
    if (!drivers[id]) continue;

    const driverReports = reports.filter((r) => r.driverId === id);
    const monthReports = driverReports.filter(
      (r) => monthKey(r.date) === currentMonth
    );

    drivers[id] = {
      ...drivers[id],
      workDays: monthReports.filter((r) => r.workStatus === "出勤").length,
      absences: monthReports.filter((r) => r.workStatus === "欠勤").length,
      monthlySales: monthReports.reduce((sum, r) => sum + r.sales, 0),
      totalSales: driverReports.reduce((sum, r) => sum + r.sales, 0),
    };
  }

  saveDrivers(drivers);
}
