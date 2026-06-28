import { supabase } from "./supabase";

type DriverLookupResult = {
  driverId: number | null;
  error?: string;
};

function getMetadataDriverId(metadata: Record<string, unknown> | undefined) {
  const raw =
    metadata?.driver_id ?? metadata?.driverId ?? metadata?.driverID ?? null;
  const driverId = Number(raw);

  return Number.isInteger(driverId) && driverId > 0 ? driverId : null;
}

export async function findDriverIdForUser({
  email,
  metadata,
}: {
  email?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<DriverLookupResult> {
  const metadataDriverId = getMetadataDriverId(metadata);

  if (metadataDriverId) {
    return { driverId: metadataDriverId };
  }

  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      driverId: null,
      error: "ログインユーザーにメールアドレスが設定されていません",
    };
  }

  const { data, error } = await supabase
    .from("drivers")
    .select("id,email")
    .ilike("email", normalizedEmail)
    .limit(1);

  if (error) {
    return { driverId: null, error: error.message };
  }

  const driver = data?.[0];

  if (!driver) {
    return {
      driverId: null,
      error: `メールアドレス ${normalizedEmail} に一致するドライバー情報がありません`,
    };
  }

  return { driverId: driver.id };
}
