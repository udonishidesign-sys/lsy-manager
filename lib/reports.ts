export type Report = {
  driverId: number;
  date: string;
  deliveryCount: number;
  sales: number;
  workStatus: "出勤" | "欠勤";
};

const STORAGE_KEY = "lsy-reports";

export function loadReports(): Report[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Report[];
  } catch {
    return [];
  }
}

export function saveReport(report: Report): void {
  const reports = loadReports();
  const index = reports.findIndex(
    (r) => r.driverId === report.driverId && r.date === report.date
  );

  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.push(report);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}
