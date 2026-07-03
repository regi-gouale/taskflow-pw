import { mkdir } from "node:fs/promises";
import { type FullConfig, request } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  const baseURL = String(config.projects[0]?.use?.baseURL);
  const email = process.env.E2E_EMAIL ?? "test@taskflow.dev";
  const password = process.env.E2E_PASSWORD ?? "Password123!";

  await mkdir("playwright/.auth", { recursive: true });

  const ctx = await request.newContext({ baseURL });

  // Endpoint Better Auth standard; adapte si ton endpoint diffère.
  const res = await ctx.post("/api/auth/sign-in/email", {
    data: { email, password },
  });

  if (!res.ok()) {
    throw new Error(
      `Login E2E impossible: ${res.status()} ${await res.text()}`,
    );
  }

  await ctx.storageState({ path: "playwright/.auth/user.json" });
  await ctx.dispose();
}
