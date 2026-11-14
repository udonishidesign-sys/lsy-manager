"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import FormSection from "@/components/ui/FormSection";
import CustomTimeSelect from "@/components/ui/CustomTimeSelect";
import PageTitle from "@/components/ui/PageTitle";
import { getDriverSessionId, setDriverSessionId } from "@/lib/driver-session";
import { findDriverIdForUser } from "@/lib/driver-auth";
import {
  deleteLocalDraft,
  getLocalDraft,
  saveLocalDraft,
} from "@/lib/local-drafts";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  ImagePlus,
  Trash2,
  X,
  Thermometer,
  ZoomIn,
  CircleX,
} from "lucide-react";

type CheckItem = { key: string; label: string };

const checkItems: CheckItem[] = [
  { key: "check_brake", label: "ブレーキ（効き具合・液量）" },
  { key: "check_tire", label: "タイヤ（空気圧・摩耗・損傷）" },
  { key: "check_handle", label: "ハンドル（操作・がたつき）" },
  { key: "check_mirror", label: "ミラー（角度・汚れ・損傷）" },
  { key: "check_wiper", label: "ワイパー（動作・ゴム状態）" },
  { key: "check_headlight", label: "ライト（前照灯・尾灯）" },
  { key: "check_turn_signal", label: "ウインカー（左右動作確認）" },
  { key: "check_hazard", label: "ハザード（動作確認）" },
  { key: "check_horn", label: "ホーン（動作確認）" },
  { key: "check_drive_recorder", label: "ドラレコ（動作確認）" },
  { key: "check_oil", label: "エンジンオイル（量・汚れ）" },
  { key: "check_coolant", label: "冷却水（量）" },
  { key: "check_battery", label: "バッテリー（液量・端子）" },
  { key: "check_fuel", label: "燃料（残量・漏れ）" },
  { key: "check_engine", label: "原動機（始動・異音・漏れ）" },
  { key: "check_light", label: "灯火装置（点灯・点滅）" },
  { key: "check_emergency_signal", label: "非常用信号（有無・期限）" },
  { key: "check_license_plate", label: "登録番号表（汚れ・損傷）" },
  { key: "check_vehicle_inspection", label: "検査証（備え付け・期限）" },
  { key: "check_insurance", label: "保険証（備え付け・期限）" },
  { key: "check_cargo_area", label: "荷室（清掃・損傷）" },
  { key: "check_load_condition", label: "積載状態（固定・バランス）" },
];

const photoItems = [
  { key: "vehicle_front", label: "車両前面" },
  { key: "vehicle_rear", label: "車両後面" },
  { key: "vehicle_key", label: "鍵" },
] as const;

type PhotoKey = (typeof photoItems)[number]["key"];
type PhotoMap = Partial<Record<PhotoKey, string>>;
type FileMap = Partial<Record<PhotoKey, File>>;
type CheckMap = Record<string, boolean | null>;

type CheckValues = Record<string, boolean | null>;

const emptyChecks = () =>
  Object.fromEntries(checkItems.map((item) => [item.key, null])) as CheckValues;

export default function DriverCheckPage() {
  const router = useRouter();

  const [reportId, setReportId] = useState<number | null>(null);
  const isEditing = reportId !== null;

  const [driverId, setDriverId] = useState<number | null>(null);
  const [requestedProjectId, setRequestedProjectId] = useState<number | null>(
    null,
  );
  const [projectParamReady, setProjectParamReady] = useState(false);

  const [selectedProject, setSelectedProject] = useState<{
    id: number;
    name: string;
    requires_vehicle_check: boolean;
  } | null>(null);

  const [projectLoading, setProjectLoading] = useState(true);

  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [checks, setChecks] = useState<CheckValues>(emptyChecks);
  const [alcoholCheckTime, setAlcoholCheckTime] = useState("");
  const [alcoholCheckFile, setAlcoholCheckFile] = useState<File | null>(null);
  const [alcoholCheckPreview, setAlcoholCheckPreview] = useState("");
  const [alcoholCheckImageUrl, setAlcoholCheckImageUrl] = useState("");
  const [temperatureCheckValue, setTemperatureCheckValue] = useState("");
  const [temperatureCheckFile, setTemperatureCheckFile] = useState<File | null>(
    null,
  );
  const [temperatureCheckPreview, setTemperatureCheckPreview] = useState("");
  const [temperatureCheckImageUrl, setTemperatureCheckImageUrl] = useState("");

  const [photoFiles, setPhotoFiles] = useState<FileMap>({});
  const [photoUrls, setPhotoUrls] = useState<PhotoMap>({});
  const [photoPreviews, setPhotoPreviews] = useState<PhotoMap>({});

  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [projectError, setProjectError] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [draftKey, setDraftKey] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

  const skipNextDraftSave = useRef(false);

  const canEdit = !!driverId && !!selectedProject?.requires_vehicle_check;

  // 点検データの読み込み
  const loadReport = useCallback(async (id: number, reportDate: string) => {
    setLoading(true);
    setDraftReady(false);
    setLoadError("");
    setSubmittedAt(null);
    const key = `vehicle-check:${id}:${reportDate}`;

    const restoreDraft = async () => {
      try {
        const draft = await getLocalDraft<Record<string, any>>(key);

        if (draft) {
          if (draft.checks) {
            const restoredChecks = emptyChecks();

            for (const item of checkItems) {
              const value = draft.checks[item.key];

              if (value === true || value === false) {
                restoredChecks[item.key] = value;
              }
            }

            setChecks(restoredChecks);
          }

          if (draft.alcoholCheckTime != null) {
            setAlcoholCheckTime(String(draft.alcoholCheckTime));
          }

          if (draft.alcoholCheckFile instanceof Blob) {
            const file = draft.alcoholCheckFile as File;
            setAlcoholCheckFile(file);
            setAlcoholCheckPreview(URL.createObjectURL(file));
          } else {
            setAlcoholCheckFile(null);
            setAlcoholCheckPreview(draft.alcoholCheckImageUrl || "");
          }

          setAlcoholCheckImageUrl(draft.alcoholCheckImageUrl || "");

          if (draft.temperatureCheckValue != null) {
            setTemperatureCheckValue(String(draft.temperatureCheckValue));
          }

          if (draft.temperatureCheckFile instanceof Blob) {
            const file = draft.temperatureCheckFile as File;
            setTemperatureCheckFile(file);
            setTemperatureCheckPreview(URL.createObjectURL(file));
          } else {
            setTemperatureCheckFile(null);
            setTemperatureCheckPreview(draft.temperatureCheckImageUrl || "");
          }

          setTemperatureCheckImageUrl(draft.temperatureCheckImageUrl || "");

          const restoredFiles = (draft.photoFiles || {}) as FileMap;
          const restoredUrls = (draft.photoUrls || {}) as PhotoMap;
          const restoredPreviews: PhotoMap = { ...restoredUrls };

          for (const item of photoItems) {
            const file = restoredFiles[item.key];

            if (file instanceof Blob) {
              restoredPreviews[item.key] = URL.createObjectURL(file);
            }
          }

          setPhotoFiles(restoredFiles);
          setPhotoUrls(restoredUrls);
          setPhotoPreviews(restoredPreviews);
        }
      } catch (error) {
        console.warn("点検の下書きを復元できませんでした", error);
      }
    };

    const { data, error } = await supabase
      .from("driver_vehicle_checks")
      .select(
        "check_date, submitted_at, alcohol_check_time, alcohol_check_image_url, temperature_check_value, temperature_check_image_url, vehicle_photos, check_brake, check_tire, check_light, check_wiper, check_drive_recorder, check_engine, check_handle, check_horn, check_turn_signal, check_battery, check_emergency_signal, check_fuel, check_coolant, check_oil, check_license_plate, check_vehicle_inspection, check_insurance, check_mirror, check_headlight, check_hazard, check_cargo_area, check_load_condition",
      )
      .eq("driver_id", id)
      .eq("check_date", reportDate)
      .maybeSingle();

    if (error) {
      setLoadError(`読み込みに失敗しました：${error.message}`);
      setLoading(false);
      setDraftKey(`${id}:${reportDate}`);
      setDraftReady(true);
      return;
    }

    if (data) {
      setSubmittedAt(data.submitted_at ?? null);
      // DBに保存済みのデータがある場合はDBを優先する。
      // 古いローカル下書きで上書きしない。
      setChecks(
        Object.fromEntries(
          checkItems.map((item) => {
            const value = (data as Record<string, unknown>)[item.key];
            return [item.key, value === true || value === false ? value : null];
          }),
        ),
      );

      setAlcoholCheckTime(data.alcohol_check_time ?? "");
      setAlcoholCheckImageUrl(data.alcohol_check_image_url ?? "");
      setAlcoholCheckFile(null);
      setAlcoholCheckPreview(data.alcohol_check_image_url ?? "");

      setTemperatureCheckValue(
        data.temperature_check_value == null
          ? ""
          : String(data.temperature_check_value),
      );
      setTemperatureCheckImageUrl(data.temperature_check_image_url ?? "");
      setTemperatureCheckFile(null);
      setTemperatureCheckPreview(data.temperature_check_image_url ?? "");

      const savedPhotos = (data.vehicle_photos ?? {}) as PhotoMap;
      setPhotoFiles({});
      setPhotoUrls(savedPhotos);
      setPhotoPreviews(savedPhotos);
    } else {
      // DBにデータがない場合だけ下書きを復元する。
      setChecks(emptyChecks());
      setAlcoholCheckTime("");
      setAlcoholCheckFile(null);
      setAlcoholCheckImageUrl("");
      setAlcoholCheckPreview("");

      setTemperatureCheckValue("");
      setTemperatureCheckFile(null);
      setTemperatureCheckImageUrl("");
      setTemperatureCheckPreview("");

      setPhotoFiles({});
      setPhotoUrls({});
      setPhotoPreviews({});

      await restoreDraft();
    }

    setDraftKey(`${id}:${reportDate}`);
    setDraftReady(true);
    setLoading(false);
  }, []);

  // URLから案件ID・日付・日報IDを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const projectValue = params.get("project_id");
    const reportValue = params.get("id");
    const dateValue = params.get("date");

    setRequestedProjectId(
      projectValue && /^\d+$/.test(projectValue) ? Number(projectValue) : null,
    );

    setReportId(
      reportValue && /^\d+$/.test(reportValue) ? Number(reportValue) : null,
    );

    if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      setDate(dateValue);
    }

    setProjectParamReady(true);
  }, []);
  // ログイン・ドライバー情報取得
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
        return;
      }

      const savedDriverId = getDriverSessionId();

      if (savedDriverId) {
        setDriverId(Number(savedDriverId));
      } else {
        const found = await findDriverIdForUser({
          email: data.session.user.email,
          metadata: data.session.user.user_metadata,
        });

        if (found.driverId) {
          setDriverSessionId(found.driverId);
          setDriverId(found.driverId);
        } else {
          setLoadError(
            "ドライバー情報を取得できませんでした。再ログインしてください。",
          );
          setLoading(false);
          setProjectLoading(false);
        }
      }
    };

    void init();
  }, [router]);

  // 担当案件・車両ナンバー取得
  useEffect(() => {
    if (!driverId || !projectParamReady) return;

    const validateProject = async () => {
      setProjectLoading(true);
      setSelectedProject(null);
      setProjectError("");

      let targetProjectId = requestedProjectId;

      // 編集の場合は、保存済みの日報から案件ID・日付を取得
      if (isEditing) {
        const { data: report, error: reportError } = await supabase
          .from("daily_reports")
          .select("id, project_id, report_date")
          .eq("id", reportId)
          .eq("driver_id", driverId)
          .maybeSingle();

        if (reportError || !report) {
          setProjectError(
            reportError
              ? `日報の取得に失敗しました：${reportError.message}`
              : "編集する日報が見つかりません。",
          );
          setProjectLoading(false);
          return;
        }

        targetProjectId = Number(report.project_id);

        if (report.report_date) {
          setDate(report.report_date);
        }
      }

      // 新規点検の場合だけ、ホーム画面での案件選択を必須にする
      if (!targetProjectId) {
        setProjectError(
          "ホーム画面で今日の案件を選択してから点検を開いてください。",
        );
        setProjectLoading(false);
        return;
      }

      // 新規点検の場合は、担当案件かどうかを確認
      // 編集の場合は、過去の日報に紐づく案件を優先する
      if (!isEditing) {
        const { data: assignment, error: assignmentError } = await supabase
          .from("driver_projects")
          .select("project_id")
          .eq("driver_id", driverId)
          .eq("project_id", targetProjectId)
          .maybeSingle();

        if (assignmentError || !assignment) {
          setProjectError(
            assignmentError
              ? `担当案件の確認に失敗しました：${assignmentError.message}`
              : "選択された案件は担当案件に登録されていません。ホーム画面に戻ってください。",
          );
          setProjectLoading(false);
          return;
        }
      }

      const [
        { data: project, error: projectErrorResult },
        { data: driver, error: driverError },
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, requires_vehicle_check")
          .eq("id", targetProjectId)
          .maybeSingle(),

        supabase
          .from("drivers")
          .select("plate_number")
          .eq("id", driverId)
          .maybeSingle(),
      ]);

      if (driverError) {
        console.warn("車両ナンバーの取得に失敗しました", driverError);
      }

      setPlateNumber(driver?.plate_number ?? "");

      if (projectErrorResult || !project) {
        setProjectError(
          projectErrorResult
            ? `案件情報の取得に失敗しました：${projectErrorResult.message}`
            : "案件情報を取得できませんでした。",
        );
        setProjectLoading(false);
        return;
      }

      if (!project.requires_vehicle_check) {
        setProjectError(
          "この案件では車両点検の入力は不要です。ホーム画面に戻ってください。",
        );
        setProjectLoading(false);
        return;
      }

      setSelectedProject(project);
      setProjectLoading(false);
    };

    void validateProject();
  }, [driverId, projectParamReady, requestedProjectId, isEditing, reportId]);

  useEffect(() => {
    if (driverId) {
      void loadReport(driverId, date);
    }
  }, [driverId, date, loadReport]);

  // 下書きの自動保存
  useEffect(() => {
    if (
      !driverId ||
      !draftReady ||
      submittedAt ||
      draftKey !== `${driverId}:${date}`
    )
      return;

    if (skipNextDraftSave.current) {
      skipNextDraftSave.current = false;
      return;
    }

    const key = `vehicle-check:${driverId}:${date}`;

    const draft = {
      checks,
      alcoholCheckTime,
      alcoholCheckFile,
      alcoholCheckImageUrl,
      temperatureCheckValue,
      temperatureCheckFile,
      temperatureCheckImageUrl,
      photoFiles,
      photoUrls,
    };

    void saveLocalDraft(key, draft).catch((error) =>
      console.warn("点検の下書きを保存できませんでした", error),
    );
  }, [
    driverId,
    date,
    draftReady,
    draftKey,
    checks,
    alcoholCheckTime,
    alcoholCheckFile,
    alcoholCheckImageUrl,
    temperatureCheckValue,
    temperatureCheckFile,
    temperatureCheckImageUrl,
    photoFiles,
    photoUrls,
    submittedAt,
  ]);

  const setCheck = (key: string, value: boolean) => {
    setChecks((prev) => ({ ...prev, [key]: value }));
  };

  const onChoosePhoto = (key: PhotoKey, file?: File) => {
    if (!file) return;

    const preview = URL.createObjectURL(file);

    setPhotoFiles((prev) => ({ ...prev, [key]: file }));
    setPhotoPreviews((prev) => ({ ...prev, [key]: preview }));
  };

  // 必須項目の確認
  // 必須項目の確認
  const validateRequiredFields = (): string[] => {
    const missing: string[] = [];

    if (!alcoholCheckTime) {
      missing.push("アルコールチェック時間");
    }

    if (!alcoholCheckFile && !alcoholCheckImageUrl) {
      missing.push("アルコールチェック写真");
    }

    const temperature = Number(temperatureCheckValue);

    if (
      temperatureCheckValue.trim() === "" ||
      !Number.isFinite(temperature) ||
      temperature < 30 ||
      temperature > 45
    ) {
      missing.push("体温（30〜45℃）");
    }

    if (!temperatureCheckFile && !temperatureCheckImageUrl) {
      missing.push("体温チェック写真");
    }

    for (const item of checkItems) {
      if (checks[item.key] !== true && checks[item.key] !== false) {
        missing.push(item.label);
      }
    }

    // 車両写真は1枚以上必須
    const hasVehiclePhoto = photoItems.some(
      (item) => photoFiles[item.key] || photoUrls[item.key],
    );

    if (!hasVehiclePhoto) {
      missing.push("車両写真（いずれか1枚以上）");
    }

    return missing;
  };

  // 保存
  const save = async () => {
    if (submittedAt) {
      alert("この点検内容は提出済みのため、変更できません。");
      return;
    }
    if (!driverId) {
      alert("ドライバー情報を取得できません。再ログインしてください。");
      return;
    }

    const missing = validateRequiredFields();

    if (missing.length > 0) {
      alert(
        `未入力の必須項目があります。\n\n${missing
          .map((item) => `・${item}`)
          .join("\n")}\n\nすべて入力してから保存してください。`,
      );
      return;
    }

    setSaving(true);

    try {
      let uploadedAlcoholUrl = alcoholCheckImageUrl || null;

      if (alcoholCheckFile) {
        const ext = alcoholCheckFile.name.split(".").pop() || "jpg";
        const path = `alcohol-checks/${driverId}/${date}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from("report-files")
          .upload(path, alcoholCheckFile);

        if (error) {
          throw new Error(
            `アルコールチェック写真のアップロードに失敗しました：${error.message}`,
          );
        }

        uploadedAlcoholUrl = supabase.storage
          .from("report-files")
          .getPublicUrl(path).data.publicUrl;
      }

      let uploadedTemperatureUrl = temperatureCheckImageUrl || null;

      if (temperatureCheckFile) {
        const ext = temperatureCheckFile.name.split(".").pop() || "jpg";
        const path = `temperature-checks/${driverId}/${date}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from("report-files")
          .upload(path, temperatureCheckFile);

        if (error) {
          throw new Error(
            `体温チェック写真のアップロードに失敗しました：${error.message}`,
          );
        }

        uploadedTemperatureUrl = supabase.storage
          .from("report-files")
          .getPublicUrl(path).data.publicUrl;
      }

      const uploadedPhotoUrls: PhotoMap = { ...photoUrls };

      for (const item of photoItems) {
        const file = photoFiles[item.key];

        if (!file) continue;

        const ext = file.name.split(".").pop() || "jpg";
        const path = `vehicle-photos/${driverId}/${date}/${item.key}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from("report-files")
          .upload(path, file);

        if (error) {
          throw new Error(
            `${item.label}のアップロードに失敗しました：${error.message}`,
          );
        }

        uploadedPhotoUrls[item.key] = supabase.storage
          .from("report-files")
          .getPublicUrl(path).data.publicUrl;
      }

      const updateData: Record<string, unknown> = {
        alcohol_check_time: alcoholCheckTime,
        alcohol_check_image_url: uploadedAlcoholUrl,
        temperature_check_value: Number(temperatureCheckValue),
        temperature_check_image_url: uploadedTemperatureUrl,
        vehicle_photos: uploadedPhotoUrls,
      };

      for (const item of checkItems) {
        // nullではなく、選択されたtrue/falseをそのまま保存
        updateData[item.key] = checks[item.key];
      }

      const { error } = await supabase.from("driver_vehicle_checks").upsert(
        {
          driver_id: driverId,
          check_date: date,
          ...updateData,
        },
        { onConflict: "driver_id,check_date" },
      );

      if (error) {
        throw new Error(`保存に失敗しました：${error.message}`);
      }

      skipNextDraftSave.current = true;

      try {
        await deleteLocalDraft(`vehicle-check:${driverId}:${date}`);
      } catch (draftError) {
        console.warn("点検下書きの削除に失敗しました", draftError);
      }

      setAlcoholCheckImageUrl(uploadedAlcoholUrl ?? "");
      setAlcoholCheckFile(null);
      setAlcoholCheckPreview(uploadedAlcoholUrl ?? "");

      setTemperatureCheckImageUrl(uploadedTemperatureUrl ?? "");
      setTemperatureCheckFile(null);
      setTemperatureCheckPreview(uploadedTemperatureUrl ?? "");

      setPhotoFiles({});
      setPhotoUrls(uploadedPhotoUrls);
      setPhotoPreviews(uploadedPhotoUrls);

      alert(
        "アルコールチェック・体温チェック・運行前点検・車両写真を保存しました。",
      );
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading || projectLoading) {
    return (
      <main className="mx-auto max-w-md p-4 pt-24">
        <p className="text-sm text-mist-500">読み込み中...</p>
      </main>
    );
  }
  if (submittedAt) {
    return (
      <main className="mx-auto max-w-md p-4 pt-24">
        <Card className="rounded-2xl border border-mist-200 shadow-sm">
          <h1 className="text-lg font-bold text-mist-800">運行前点検</h1>

          <div className="mt-4 rounded-lg bg-teal-50 p-4">
            <p className="font-bold text-teal-700">
              管理者への提出が完了しています
            </p>
            <p className="mt-2 text-sm text-mist-600">
              この点検内容は提出済みのため、編集できません。
            </p>
          </div>

          <div className="mt-4 space-y-2 text-sm text-mist-600">
            <p>対象日：{date}</p>
            <p>案件：{selectedProject?.name}</p>
            <p>
              提出日時：
              {new Date(submittedAt).toLocaleString("ja-JP")}
            </p>
          </div>

          <Button
            className="mt-5 w-full"
            onClick={() => router.push("/test/report")}
          >
            ホーム画面に戻る
          </Button>
        </Card>
      </main>
    );
  }
  if (!canEdit) {
    return (
      <main className="mx-auto max-w-md p-4 pt-24">
        <Card className="rounded-2xl border border-mist-200 shadow-sm">
          <h1 className="text-lg font-bold text-mist-800">運行前点検</h1>
          <p className="mt-3 text-sm text-red-600">
            {projectError ||
              loadError ||
              "点検対象の案件を確認できませんでした。"}
          </p>
          <Button
            className="mt-4 w-full"
            onClick={() => router.push("/test/report")}
          >
            ホーム画面に戻る
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pb-36 pt-24">
      <div className="mx-auto max-w-md space-y-5">
        <header className="rounded-lg border border-mist-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 rounded-t-lg bg-mist-100 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
              <ClipboardCheck size={24} />
            </div>
            <div className="min-w-0">
              <PageTitle>運行前点検</PageTitle>
              <p className="mt-0.5 text-xs leading-5 text-mist-500">
                アルコール・体温・車両の状態を記録
              </p>
            </div>
          </div>

          <div className="w-full min-w-0 max-w-full p-4">
            <label className="block text-sm font-bold text-mist-500">
              対象日
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="block w-full max-w-full min-w-0 box-border appearance-none rounded-md border border-mist-200 bg-mist-50 px-3 py-3 text-base text-mist-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />

            {loadError && (
              <p className="mt-3 text-sm text-red-600">{loadError}</p>
            )}

            <div className="mt-3 flex gap-4">
              <div className="basis-1/2">
                <label className="mb-1 text-sm font-bold text-mist-500">
                  案件
                </label>
                <p className="rounded-md bg-mist-100 px-4 py-3 text-base text-mist-600">
                  {selectedProject?.name}
                </p>
              </div>

              <div className="basis-1/2">
                <label className="mb-1 text-sm font-bold text-mist-500">
                  車両ナンバー
                </label>
                <p className="rounded-md bg-mist-100 px-4 py-3 text-base text-mist-600">
                  {plateNumber || "未登録"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <Card className="rounded-2xl border border-mist-200 shadow-sm">
          <FormSection
            icon={<ClipboardCheck size={22} />}
            title="アルコールチェック"
          />

          <CustomTimeSelect
            label="チェック時間"
            value={alcoholCheckTime}
            onChange={setAlcoholCheckTime}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-sm font-bold text-mist-700">
                アルコールチェック写真{" "}
              </p>

              <label className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-mist-300 bg-mist-50">
                {alcoholCheckPreview ? (
                  <img
                    src={alcoholCheckPreview}
                    alt="アルコールチェック写真"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-mist-500">
                    <ImagePlus size={24} />
                    <span className="text-center text-xs">写真を追加</span>
                  </span>
                )}

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;

                    if (file) {
                      setAlcoholCheckFile(file);
                      setAlcoholCheckPreview(URL.createObjectURL(file));
                    }

                    event.target.value = "";
                  }}
                />
              </label>

              {alcoholCheckPreview && (
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1 rounded bg-teal-100 py-1 text-xs text-teal-700"
                    onClick={() => setEnlargedPhoto(alcoholCheckPreview)}
                  >
                    <ZoomIn size={12} />
                    拡大
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center gap-1 rounded bg-red-100 py-1 text-xs text-red-600"
                    onClick={() => {
                      setAlcoholCheckFile(null);
                      setAlcoholCheckImageUrl("");
                      setAlcoholCheckPreview("");
                    }}
                  >
                    <Trash2 size={12} />
                    削除
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-mist-200 shadow-sm">
          <FormSection icon={<Thermometer size={24} />} title="体温チェック" />
          <Input
            label="体温（℃）"
            type="number"
            placeholder="例：36.5"
            value={temperatureCheckValue}
            onChange={(event) => setTemperatureCheckValue(event.target.value)}
            className="h-12 w-full rounded-md border border-mist-200 bg-mist-50 px-3 text-mist-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-sm font-bold text-mist-700">
                体温チェック写真
              </p>

              <label className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-mist-300 bg-mist-50">
                {temperatureCheckPreview ? (
                  <img
                    src={temperatureCheckPreview}
                    alt="体温チェック写真"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-mist-500">
                    <ImagePlus size={24} />
                    <span className="text-center text-xs">写真を追加</span>
                  </span>
                )}

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;

                    if (file) {
                      setTemperatureCheckFile(file);
                      setTemperatureCheckPreview(URL.createObjectURL(file));
                    }

                    event.target.value = "";
                  }}
                />
              </label>

              {temperatureCheckPreview && (
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1 rounded bg-teal-100 py-1 text-xs text-teal-700"
                    onClick={() => setEnlargedPhoto(temperatureCheckPreview)}
                  >
                    <ZoomIn size={12} />
                    拡大
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center gap-1 rounded bg-red-100 py-1 text-xs text-red-600"
                    onClick={() => {
                      setTemperatureCheckFile(null);
                      setTemperatureCheckImageUrl("");
                      setTemperatureCheckPreview("");
                    }}
                  >
                    <Trash2 size={12} />
                    削除
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-mist-200 shadow-sm">
          <FormSection icon={<CheckCircle2 size={22} />} title="車両点検" />
          <div className="space-y-2">
            {checkItems.map((item) => {
              const selected = checks[item.key];

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-mist-200 bg-white px-3 py-2"
                >
                  <span className="min-w-0 flex-1 text-sm font-bold text-mist-700">
                    {item.label}
                  </span>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setCheck(item.key, true)}
                      className={`flex h-9 w-10 items-center justify-center rounded-md text-base font-bold transition-colors ${
                        selected === true
                          ? "bg-green-600 text-white"
                          : selected === false
                            ? "bg-mist-100 text-mist-400"
                            : "bg-green-50 text-green-700"
                      }`}
                      aria-pressed={selected === true}
                    >
                      <CheckCircle2 size={20} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheck(item.key, false)}
                      className={`flex h-9 w-10 items-center justify-center rounded-md text-base font-bold transition-colors ${
                        selected === false
                          ? "bg-rose-600 text-white"
                          : selected === true
                            ? "bg-mist-100 text-mist-400"
                            : "bg-rose-50 text-rose-700"
                      }`}
                      aria-pressed={selected === false}
                    >
                      <CircleX size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-2xl border border-mist-200 shadow-sm">
          <FormSection icon={<Camera size={22} />} title="車両写真" />
          <div className="grid grid-cols-3 gap-3">
            {photoItems.map((item) => {
              const preview = photoPreviews[item.key];

              return (
                <div key={item.key} className="min-w-0">
                  <p className="mb-1 text-sm font-bold text-mist-700">
                    {item.label}
                  </p>

                  <label className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-mist-300 bg-mist-50">
                    {preview ? (
                      <img
                        src={preview}
                        alt={item.label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex flex-col items-center gap-1 text-mist-500">
                        <ImagePlus size={24} />
                        <span className="text-xs">写真を追加</span>
                      </span>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(event) => {
                        onChoosePhoto(item.key, event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>

                  {preview && (
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-1 rounded bg-teal-100 py-1 text-xs text-teal-700"
                        onClick={() => setEnlargedPhoto(preview)}
                      >
                        <ZoomIn size={12} />
                        拡大
                      </button>

                      <button
                        type="button"
                        className="flex items-center justify-center gap-1 rounded bg-red-100 py-1 text-xs text-red-600"
                        onClick={() => {
                          setPhotoFiles((prev) => {
                            const next = { ...prev };
                            delete next[item.key];
                            return next;
                          });

                          setPhotoUrls((prev) => {
                            const next = { ...prev };
                            delete next[item.key];
                            return next;
                          });

                          setPhotoPreviews((prev) => {
                            const next = { ...prev };
                            delete next[item.key];
                            return next;
                          });
                        }}
                      >
                        <Trash2 size={12} />
                        削除
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="fixed bottom-16 left-0 right-0 z-50 mx-auto max-w-md bg-teal-50 p-4">
          <Button
            className="w-full"
            onClick={save}
            disabled={saving || Boolean(submittedAt)}
          >
            {saving ? "保存中..." : "点検内容を保存"}
          </Button>
        </div>

        {enlargedPhoto && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
            onClick={() => setEnlargedPhoto(null)}
          >
            <button
              type="button"
              aria-label="閉じる"
              className="absolute right-4 top-4 rounded-full bg-white p-2"
              onClick={() => setEnlargedPhoto(null)}
            >
              <X size={22} />
            </button>

            <img
              src={enlargedPhoto}
              alt="写真の拡大表示"
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        )}
      </div>
    </main>
  );
}
