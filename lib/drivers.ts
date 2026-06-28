export type Driver = {
  id: number;
  name: string;
  status: "稼働中" | "休職中";
  phone?: string;
  address?: string;
  birth_date?: string;
  vehicle_type?: string;
  plate_number?: string;
  created_at?: string;
};
export const DEFAULT_DRIVERS: Driver[] = [
  {
    id: 1,
    name: "山田太郎",
    status: "稼働中",
    phone: "090-1234-5678",
    address: "東京都渋谷区神南1-2-3",
    birth_date: "1985-04-12",
    vehicle_type: "ハイエース",
    plate_number: "品川 500 あ 12-34",
  },
  {
    id: 2,
    name: "田中一郎",
    status: "休職中",
    phone: "080-9876-5432",
    address: "神奈川県横浜市西区1-5-10",
    birth_date: "1990-08-25",
    vehicle_type: "NV200",
    plate_number: "横浜 300 い 56-78",
  },
  {
    id: 3,
    name: "鈴木次郎",
    status: "稼働中",
    phone: "070-5555-1111",
    address: "埼玉県さいたま市大宮区2-8-4",
    birth_date: "1988-11-03",
    vehicle_type: "プロボックス",
    plate_number: "大宮 400 う 90-12",
  },
];

const STORAGE_KEY = "lsy-drivers";

export function createEmptyDriver(name: string): Driver {
  return {
    id: 0,
    name,
    status: "稼働中",
    phone: "",
    address: "",
    birth_date: "",
    vehicle_type: "",
    plate_number: "",
  };
}

function normalizeDriver(raw: Partial<Driver> & { name: string }): Driver {
  return {
    id: raw.id ?? 0,
    name: raw.name,
    status: raw.status === "休職中" ? "休職中" : "稼働中",
    phone: raw.phone ?? "",
    address: raw.address ?? "",
    birth_date: raw.birth_date ?? "",
    vehicle_type: raw.vehicle_type ?? "",
    plate_number: raw.plate_number ?? "",
  };
}

export function loadDrivers(): Driver[] {
  if (typeof window === "undefined") return DEFAULT_DRIVERS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DRIVERS;
    const parsed = JSON.parse(raw) as Array<Partial<Driver> & { name: string }>;
    return parsed.map(normalizeDriver);
  } catch {
    return DEFAULT_DRIVERS;
  }
}

export function saveDrivers(drivers: Driver[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drivers));
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}
