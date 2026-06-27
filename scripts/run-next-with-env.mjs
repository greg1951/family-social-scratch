import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { SignJWT, importPKCS8 } from "jose";

const [, , envFileArg, ...nextArgs] = process.argv;

if (!envFileArg) {
  console.error("Missing env file argument.");
  process.exit(1);
}

const envFilePath = resolve(process.cwd(), envFileArg);
const childEnv = { ...process.env };

// Avoid stale shell-level auth host values leaking into local dev runs.
delete childEnv.AUTH_URL;
delete childEnv.NEXTAUTH_URL;

async function ensureAppleClientSecret(env) {
  const hasSecret = typeof env.AUTH_APPLE_SECRET === "string" && env.AUTH_APPLE_SECRET.trim().length > 0;
  if (hasSecret) {
    return;
  }

  const required = [
    "AUTH_APPLE_ID",
    "AUTH_APPLE_TEAM_ID",
    "AUTH_APPLE_KEY_ID",
    "AUTH_APPLE_PRIVATE_KEY",
  ];
  const missing = required.find((key) => !(typeof env[key] === "string" && env[key].trim().length > 0));
  if (missing) {
    return;
  }

  const privateKey = env.AUTH_APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const ecKey = await importPKCS8(privateKey, "ES256");
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.AUTH_APPLE_KEY_ID })
    .setIssuer(env.AUTH_APPLE_TEAM_ID)
    .setIssuedAt()
    .setAudience("https://appleid.apple.com")
    .setSubject(env.AUTH_APPLE_ID)
    .setExpirationTime("6h")
    .sign(ecKey);

  env.AUTH_APPLE_SECRET = token;
}

if (existsSync(envFilePath)) {
  const envContent = readFileSync(envFilePath, "utf8");

  for (const rawLine of envContent.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    childEnv[key] = value;
  }
} else {
  console.warn(`${envFileArg} not found. Continuing without it.`);
}

await ensureAppleClientSecret(childEnv);

const nextBinPath = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBinPath, "dev", ...nextArgs], {
  stdio: "inherit",
  env: childEnv,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});