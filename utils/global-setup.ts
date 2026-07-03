import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { type FullConfig, request } from "@playwright/test";
import { formatISO } from "date-fns";

export default async function globalSetup(config: FullConfig) {
  const launchAt = new Date();
  const launchIso = formatISO(launchAt);
  const launchEpochMs = launchAt.getTime();

  await mkdir("allure-results", { recursive: true });
  await writeFile(
    "allure-results/executor.json",
    JSON.stringify(
      {
        name: "Playwright",
        type: "playwright",
        buildName: `Taskflow E2E ${launchIso}`,
        buildOrder: Number(process.env.ALLURE_BUILD_ORDER ?? launchEpochMs),
        reportName: `Taskflow E2E run ${launchIso}`,
        buildUrl: process.env.CI_JOB_URL,
      },
      null,
      2,
    ),
  );
  await writeFile(
    "allure-results/environment.properties",
    `${[
      `launch.time.iso=${launchIso}`,
      `launch.time.epochMs=${launchEpochMs}`,
      `launch.time.timezone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    ].join("\n")}\n`,
  );

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
