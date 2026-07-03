import "dotenv/config";
import { mkdir } from "node:fs/promises";
import { type FullConfig, request } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects.find((p) => p.use?.baseURL)?.use?.baseURL;
  if (!baseURL) {
    throw new Error("Missing Playwright baseURL for global auth setup.");
  }

  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing E2E_EMAIL or E2E_PASSWORD environment variables.");
  }

  await mkdir("playwright/.auth", { recursive: true });

  // const ctx = await request.newContext({ baseURL });

  // // Endpoint Better Auth standard; adapte si ton endpoint diffère.
  // const res = await ctx.post("/api/auth/sign-in/email", {
  //   data: { email, password },
  // });

  // if (!res.ok()) {
  //   throw new Error(
  //     `Login E2E impossible: ${res.status()} ${await res.text()}`,
  //   );
  // }

  // await ctx.storageState({ path: "playwright/.auth/user.json" });
  // await ctx.dispose();
  const ctx = await request.newContext({ baseURL: String(baseURL) });

  try {
    const candidates = [
      process.env.API_SIGN_IN_PATH,
      "/api/auth/sign-in",
      "/api/auth/sign-in/email",
    ].filter(Boolean) as string[];

    let lastStatus = 0;
    let lastText = "";

    for (const path of candidates) {
      const res = await ctx.post(path, { data: { email, password } });
      if (res.ok()) {
        await ctx.storageState({ path: "playwright/.auth/user.json" });
        return;
      }
      lastStatus = res.status();
      lastText = await res.text();
    }
    throw new Error(`Login E2E impossible: ${lastStatus} ${lastText}`);
  } finally {
    await ctx.dispose();
  }
}
