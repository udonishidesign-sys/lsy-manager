import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

type Row = Record<string, any>;

type Props = {
  date: string;
  driverName: string;
  projectName: string;
  report: Row | null;
  check: Row | null;
  mileage: number | null;
  photoEntries: Array<[string, string | null | undefined]>;
  complianceRecords: [string, unknown][];
};

Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: "/fonts/NotoSansJP-Regular.otf", fontWeight: 400 },
    { src: "/fonts/NotoSansJP-Regular.otf", fontWeight: 700 },
  ],
});

/**
 * プレビューの794×1123pxをPDFのA4ポイントへ換算。
 * 1px = 0.75pt。プレビューの左右40px余白はPDFの30pt。
 */
const C = {
  mist100: "#f1f5f9",
  mist300: "#cbd5e1",
  mist400: "#94a3b8",
  mist500: "#64748b",
  mist600: "#64748b",
  mist700: "#475569",
  mist800: "#1e293b",
  mist900: "#0f172a",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 30,
    fontFamily: "NotoSansJP",
    fontSize: 10.5,
    color: C.mist800,
    backgroundColor: C.white,
  },

  // 1ページ目ヘッダー
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerLeft: {
    flexDirection: "column",
  },
  brand: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: 700,
    color: C.mist600,
  },
  title: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 1.35,
    fontWeight: 700,
    color: C.mist900,
  },
  date: {
    marginTop: 6,
    fontSize: 10.5,
    color: C.mist600,
    textAlign: "right",
  },
  page2Header: {
    marginTop: 6,
  },

  // プレビューの mt-4（16px）相当
  section: {
    marginTop: 12,
  },
  // PreviewSection: bg-mist-600 px-3 py-2 text-sm font-bold text-white
  sectionTitle: {
    width: "100%",
    backgroundColor: C.mist600,
    paddingVertical: 6,
    paddingHorizontal: 9,
    fontSize: 10.5,
    lineHeight: 1.35,
    fontWeight: 700,
    color: C.white,
  },

  // 22% / 28% / 22% / 28% の表
  table: {
    width: "100%",
    borderLeftWidth: 0.75,
    borderTopWidth: 0.75,
    borderColor: C.mist400,
  },
  tableRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  tableCell: {
    minHeight: 27,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: C.mist400,
    paddingVertical: 6,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  tableLabel: {
    width: "22%",
    backgroundColor: C.mist100,
  },
  tableValue: {
    width: "28%",
    backgroundColor: C.white,
  },
  tableLabelText: {
    fontSize: 9,
    lineHeight: 1.35,
    fontWeight: 700,
    color: C.mist700,
  },
  tableValueText: {
    fontSize: 10.5,
    lineHeight: 1.4,
    color: C.mist800,
  },

  // 欠勤理由 22% / 78%、法定記録 30% / 70%
  fullRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  fullLabel: {
    minHeight: 27,
    backgroundColor: C.mist100,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: C.mist400,
    paddingVertical: 6,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  fullValue: {
    minHeight: 27,
    backgroundColor: C.white,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: C.mist400,
    paddingVertical: 6,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  // 備考
  note: {
    borderWidth: 0.75,
    borderColor: C.mist400,
    minHeight: 42,
    paddingVertical: 9,
    paddingHorizontal: 9,
    justifyContent: "flex-start",
  },
  noteText: {
    fontSize: 10.5,
    lineHeight: 1.45,
    color: C.mist700,
  },

  // 車両点検項目：4列、各項目75% / 25%
  checkGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    borderLeftWidth: 0.75,
    borderTopWidth: 0.75,
    borderColor: C.mist400,
  },
  checkItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "stretch",
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: C.mist400,
  },
  checkItemLabel: {
    width: "75%",
    paddingVertical: 3,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  checkItemResult: {
    width: "25%",
    backgroundColor: C.white,
    borderLeftWidth: 0.75,
    borderColor: C.mist400,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  checkLabel: {
    fontSize: 9,
    lineHeight: 1.3,
    color: C.mist700,
  },
  checkResult: {
    fontSize: 10.5,
    fontWeight: 700,
    color: C.mist600,
    textAlign: "center",
  },

  // 車両点検写真：4列
  photoTable: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    borderLeftWidth: 0.75,
    borderTopWidth: 0.75,
    borderColor: C.mist400,
  },
  photoItem: {
    width: "33.3333%",
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: C.mist400,
    padding: 6,
  },
  photoLabel: {
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  photoLabelText: {
    fontSize: 9,
    fontWeight: 700,
    color: C.mist600,
  },
  photoArea: {
    height: 84,
    justifyContent: "center",
    alignItems: "center",
  },
  photo: {
    width: "100%",
    height: 84,
    objectFit: "contain",
  },
  photoMissing: {
    width: "100%",
    height: 84,
    justifyContent: "center",
    alignItems: "center",
  },
  photoMissingText: {
    fontSize: 9,
    color: C.mist500,
  },

  // フッター：preview bottom-8 / left-10 / right-10
  footer: {
    position: "absolute",
    bottom: 24,
    left: 30,
    right: 30,
    paddingTop: 9,
    borderTopWidth: 0.75,
    borderTopColor: C.mist300,
    fontSize: 7.5,
    color: C.mist500,
  },
});

function display(value: unknown, suffix = "") {
  if (value === null || value === undefined || value === "") return "未入力";
  return `${String(value)}${suffix}`;
}

function displayTime(value: unknown) {
  return value ? String(value).slice(0, 5) : "未入力";
}

function formatDate(value: string) {
  if (!value) return "未入力";
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function records(value: unknown): string[] {
  if (value === null || value === undefined || value === "") return [];

  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [value];
    }
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return Object.entries(item as Record<string, unknown>)
          .map(([key, val]) => `${key}: ${val ?? "未入力"}`)
          .join(" / ");
      }
      return String(item);
    });
  }

  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed as Record<string, unknown>).map(
      ([key, val]) => `${key}: ${val ?? "未入力"}`,
    );
  }

  return [String(parsed)];
}

const inspectionItems = [
  ["check_brake", "ブレーキ"],
  ["check_tire", "タイヤ"],
  ["check_handle", "ハンドル"],
  ["check_mirror", "ミラー"],
  ["check_wiper", "ワイパー"],
  ["check_headlight", "前照灯"],
  ["check_turn_signal", "ウインカー"],
  ["check_hazard", "ハザード"],
  ["check_horn", "ホーン"],
  ["check_drive_recorder", "ドライブレコーダー"],
  ["check_oil", "エンジンオイル"],
  ["check_coolant", "冷却水"],
  ["check_battery", "バッテリー"],
  ["check_fuel", "燃料"],
  ["check_engine", "原動機"],
  ["check_light", "灯火装置"],
  ["check_emergency_signal", "非常用信号"],
  ["check_license_plate", "登録番号表"],
  ["check_vehicle_inspection", "車検証"],
  ["check_insurance", "保険証"],
  ["check_cargo_area", "荷室"],
  ["check_load_condition", "積載状態"],
] as const;

function Header({ date }: { date: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.brand}>DRIVER DAILY REPORT</Text>
        <Text style={styles.title}>運行日報</Text>
      </View>
      <Text style={styles.date}>{formatDate(date)}</Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function TableCell({
  label,
  value,
  labelWidth,
  valueWidth,
}: {
  label: string;
  value: unknown;
  labelWidth?: string;
  valueWidth?: string;
}) {
  const imageValue =
    value && typeof value === "object" && "uri" in (value as object);

  return (
    <>
      <View
        style={[
          styles.tableCell,
          styles.tableLabel,
          labelWidth ? { width: labelWidth } : {},
        ]}
      >
        <Text style={styles.tableLabelText}>{label}</Text>
      </View>
      <View
        style={[
          styles.tableCell,
          styles.tableValue,
          valueWidth ? { width: valueWidth } : {},
        ]}
      >
        {imageValue ? (
          <Image
            src={(value as { uri: string }).uri}
            style={{ width: "100%", height: 84, objectFit: "contain" }}
          />
        ) : (
          <Text style={styles.tableValueText}>{display(value)}</Text>
        )}
      </View>
    </>
  );
}

function FullTableRow({
  label,
  value,
  labelWidth = "30%",
  valueWidth = "70%",
}: {
  label: string;
  value: string;
  labelWidth?: string;
  valueWidth?: string;
}) {
  return (
    <View style={styles.fullRow}>
      <View style={[styles.fullLabel, { width: labelWidth }]}>
        <Text style={styles.tableLabelText}>{label}</Text>
      </View>
      <View style={[styles.fullValue, { width: valueWidth }]}>
        <Text style={styles.tableValueText}>{value}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>本帳票はアプリに保存された記録を出力したものです。</Text>
    </View>
  );
}

function PhotoBox({ label, url }: { label: string; url?: string | null }) {
  return (
    <View style={styles.photoItem} wrap={false}>
      <View style={styles.photoLabel}>
        <Text style={styles.photoLabelText}>{label}</Text>
      </View>
      <View style={styles.photoArea}>
        {url ? (
          <Image src={url} style={styles.photo} />
        ) : (
          <View style={styles.photoMissing}>
            <Text style={styles.photoMissingText}>未入力</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ReportPdfDocument({
  date,
  driverName,
  projectName,
  report,
  check,
  mileage,
  photoEntries = [],
  complianceRecords = [],
}: Props) {
  const isShein = projectName === "SHEIN";

  return (
    <Document
      title={`運行日報_${date}`}
      author="LSY"
      subject={`運行日報（稼働日：${formatDate(date)}）`}
    >
      {/* 1ページ目：運行日報・法定記録 */}
      <Page size="A4" style={styles.page} wrap>
        <Header date={date} />

        {!report && <Text>日報：未入力</Text>}

        <View style={styles.section}>
          <SectionTitle>ドライバー情報</SectionTitle>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <TableCell label="氏名" value={driverName} />
              <TableCell label="車両番号" value={report?.plate_number} />
            </View>
          </View>
        </View>

        {isShein ? (
          <View style={styles.section}>
            <SectionTitle>運行記録</SectionTitle>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <TableCell
                  label="案件名"
                  value={projectName}
                  labelWidth="22%"
                  valueWidth="78%"
                />
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <SectionTitle>運行記録</SectionTitle>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <TableCell label="案件名" value={projectName} />
                  <TableCell label="配送エリア" value={report?.delivery_area} />
                </View>
                <View style={styles.tableRow}>
                  <TableCell
                    label="業務開始時間"
                    value={
                      report?.start_time
                        ? `${displayTime(report.start_time)}`
                        : null
                    }
                  />
                  <TableCell
                    label="業務終了時間"
                    value={
                      report?.end_time
                        ? `${displayTime(report.end_time)}`
                        : null
                    }
                  />
                </View>
                <View style={styles.tableRow}>
                  <TableCell
                    label="休憩開始時刻"
                    value={displayTime(report?.break_start)}
                  />
                  <TableCell
                    label="休憩終了時刻"
                    value={displayTime(report?.break_end)}
                  />
                </View>
                <View style={styles.tableRow}>
                  <TableCell label="出発場所" value={report?.start_location} />
                  <TableCell label="帰着場所" value={report?.end_location} />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <SectionTitle>走行記録</SectionTitle>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <TableCell
                    label="出庫メーター"
                    value={
                      report?.odometer_start == null
                        ? null
                        : `${report.odometer_start} km`
                    }
                  />
                  <TableCell
                    label="帰庫メーター"
                    value={
                      report?.odometer_end == null
                        ? null
                        : `${report.odometer_end} km`
                    }
                  />
                </View>
                <View style={styles.tableRow}>
                  <TableCell
                    label="走行距離"
                    value={mileage === null ? null : `${mileage} km`}
                    labelWidth="22%"
                    valueWidth="78%"
                  />
                </View>
              </View>
            </View>

            {report?.work_status === "欠勤" && (
              <View style={styles.section}>
                <SectionTitle>欠勤記録</SectionTitle>
                <View style={styles.table}>
                  <FullTableRow
                    label="欠勤理由"
                    value={display(report.absence_reason)}
                    labelWidth="22%"
                    valueWidth="78%"
                  />
                </View>
              </View>
            )}

            <View style={styles.section}>
              <SectionTitle>法定記録・追加記録</SectionTitle>
              <View style={styles.table}>
                {complianceRecords.map(([label, value]) => {
                  const list = records(value);
                  return (
                    <FullTableRow
                      key={label}
                      label={label}
                      value={list.length > 0 ? list.join("\n") : "未入力"}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.section} wrap={false}>
              <SectionTitle>備考</SectionTitle>
              <View style={styles.note}>
                <Text style={styles.noteText}>{display(report?.note)}</Text>
              </View>
            </View>
          </>
        )}

        <Footer />
      </Page>

      {/* 2ページ目：点検・写真（SHEIN以外） */}
      {!isShein && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.page2Header}>
            <Text style={styles.title}>運行前点検・確認記録</Text>
          </View>

          {!check && <Text>点検記録：未入力</Text>}

          <View style={{ marginTop: 6 }}>
            <SectionTitle>アルコール・体温確認記録</SectionTitle>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <TableCell
                  label="アルコールチェック時刻"
                  value={displayTime(check?.alcohol_check_time)}
                />
                <TableCell
                  label="体温"
                  value={
                    check?.temperature_check_value == null
                      ? null
                      : `${check.temperature_check_value} ℃`
                  }
                />
              </View>
              <View style={styles.tableRow}>
                <TableCell
                  label="アルコールチェック写真"
                  value={
                    check?.alcohol_check_image_url
                      ? { uri: check.alcohol_check_image_url }
                      : null
                  }
                />
                <TableCell
                  label="体温チェック写真"
                  value={
                    check?.temperature_check_image_url
                      ? { uri: check.temperature_check_image_url }
                      : null
                  }
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>車両点検項目</SectionTitle>
            <View style={styles.checkGrid}>
              {inspectionItems.map(([key, label]) => {
                const value = check?.[key];
                const result =
                  value === true ? "OK" : value === false ? "NG" : "未";

                return (
                  <View key={key} style={styles.checkItem} wrap={false}>
                    <View style={styles.checkItemLabel}>
                      <Text style={styles.checkLabel}>{label}</Text>
                    </View>
                    <View style={styles.checkItemResult}>
                      <Text style={styles.checkResult}>{result}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>車両点検写真</SectionTitle>
            <View style={styles.photoTable}>
              {photoEntries.map(([label, url]) => (
                <PhotoBox key={label} label={label} url={url} />
              ))}
            </View>
          </View>

          <Footer />
        </Page>
      )}
    </Document>
  );
}
