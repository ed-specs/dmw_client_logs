import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function uniqById(rows = []) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const id = r?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(r);
  }
  return out;
}

export const getCatalogsCached = unstable_cache(
  async () => {
    const [{ data: jobsites }, { data: positions }] = await Promise.all([
      supabaseAdmin.from("jobsites").select("name").order("name"),
      supabaseAdmin.from("positions").select("name").order("name"),
    ]);
    return {
      dbJobsites: (jobsites || []).map((r) => r.name),
      dbPositions: (positions || []).map((r) => r.name),
    };
  },
  ["catalogs-v1"],
  { revalidate: 300, tags: ["catalogs"] },
);

export const getProfilesNameMapCached = unstable_cache(
  async () => {
    const { data } = await supabaseAdmin.from("profiles").select("id,name,role");
    const recorderNameById = Object.fromEntries(
      (data || []).map((p) => [
        p.id,
        (p.name && String(p.name).trim()) || "—",
      ]),
    );
    return { profiles: data || [], recorderNameById };
  },
  ["profiles-name-map-v1"],
  { revalidate: 300, tags: ["profiles"] },
);

export const getAdminClientLogsCached = unstable_cache(
  async () => {
    const { data } = await supabaseAdmin
      .from("client_logs")
      .select("*")
      .order("date", { ascending: false });
    return data || [];
  },
  ["client-logs-admin-v1"],
  { revalidate: 30, tags: ["client_logs"] },
);

export async function getUserClientLogsCached(userId, userRole) {
  const key = `client-logs-user-v1:${userId}:${userRole}`;
  const cachedFn = unstable_cache(
    async () => {
      // Avoid `.or(...)` parsing edge cases by doing two queries then merging.
      const [{ data: byProvince }, { data: byCreator }] = await Promise.all([
        supabaseAdmin
          .from("client_logs")
          .select("*")
          .eq("province", userRole)
          .order("date", { ascending: false }),
        supabaseAdmin
          .from("client_logs")
          .select("*")
          .eq("created_by", userId)
          .order("date", { ascending: false }),
      ]);

      const merged = uniqById([...(byProvince || []), ...(byCreator || [])]);
      // Stable sort (date desc, id desc)
      merged.sort(
        (a, b) =>
          String(b.date || "").localeCompare(String(a.date || "")) ||
          String(b.id || "").localeCompare(String(a.id || "")),
      );
      return merged;
    },
    [key],
    { revalidate: 30, tags: ["client_logs"] },
  );
  return await cachedFn();
}

export async function getUserServicesLogsCached(userRole) {
  const key = `services-user-v1:${userRole}`;
  const cachedFn = unstable_cache(
    async () => {
      const { data } = await supabaseAdmin
        .from("client_logs")
        .select("id,date,province,purpose,created_by")
        .eq("province", userRole)
        .order("date", { ascending: false });
      return data || [];
    },
    [key],
    { revalidate: 30, tags: ["client_logs"] },
  );
  return await cachedFn();
}

