"use server";

import { revalidateTag } from "next/cache";

export async function revalidateClientLogs() {
  revalidateTag("client_logs");
  return { success: true };
}

export async function revalidateCatalogs() {
  revalidateTag("catalogs");
  return { success: true };
}

export async function revalidateProfiles() {
  revalidateTag("profiles");
  return { success: true };
}

