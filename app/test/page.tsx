import { supabase } from "@/lib/supabase";

export default async function TestPage() {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .order("id");

  return (
    <pre>
      {JSON.stringify(
        {
          count: data?.length,
          data,
          error,
        },
        null,
        2
      )}
    </pre>
  );
}