import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:https";
import next from "next";
import { SignJWT, importPKCS8 } from "jose";

const [, , ...cliArgs] = process.argv;
const firstArg = cliArgs[0];
const hasExplicitEnvFile = Boolean(firstArg) && !String(firstArg).startsWith("-");
const envFileArg = hasExplicitEnvFile ? firstArg : undefined;
const unfilteredNextArgs = hasExplicitEnvFile ? cliArgs.slice(1) : cliArgs;
const shouldStart = unfilteredNextArgs.includes("--start");
const shouldUseHttps = unfilteredNextArgs.includes("--experimental-https");
const httpsOptionNames = new Set([
  "--experimental-https",
  "--experimental-https-key",
  "--experimental-https-cert",
]);
// Only the custom `--start` HTTPS server consumes these flags; `next dev` needs them passed through.
const nextArgs = unfilteredNextArgs.filter((arg, index, args) =>
  arg !== "--start" &&
  (!shouldStart || (!httpsOptionNames.has(arg) && !httpsOptionNames.has(args[index - 1]))),
);
const childEnv = { ...process.env };

function getOptionValue(optionName) {
  const optionIndex = unfilteredNextArgs.indexOf(optionName);
  return optionIndex === -1 ? undefined : unfilteredNextArgs[optionIndex + 1];
}

function resolvePreferredEnvFile(explicitEnvFile) {
  if (explicitEnvFile) {
    return resolve(process.cwd(), explicitEnvFile);
  }

  const candidates = [
    ".env.google-local",
    ".env.local",
    ".env.development.local",
    ".env.development",
    ".env",
  ];

  const found = candidates.find((candidate) => existsSync(resolve(process.cwd(), candidate)));
  if (!found) {
    return null;
  }

  return resolve(process.cwd(), found);
}

const envFilePath = resolvePreferredEnvFile(envFileArg);

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

if (envFilePath && existsSync(envFilePath)) {
  const envFileName = envFilePath.replace(`${process.cwd()}\\`, "");
  console.log(`Loading env vars from ${envFileName}`);
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
} else if (envFileArg) {
  console.warn(`${envFileArg} not found. Continuing without it.`);
} else {
  console.warn("No env file found. Continuing with existing process environment only.");
}

console.log("Auth host diagnostics", {
  authUrl: childEnv.AUTH_URL ?? null,
  nextAuthUrl: childEnv.NEXTAUTH_URL ?? null,
});

const hasFamilySocialDatabaseUrl = typeof childEnv.FAMILY_SOCIAL_DATABASE_URL === "string" && childEnv.FAMILY_SOCIAL_DATABASE_URL.trim().length > 0;
const hasDatabaseUrl = typeof childEnv.DATABASE_URL === "string" && childEnv.DATABASE_URL.trim().length > 0;
console.log("DB env diagnostics", {
  nodeEnv: childEnv.NODE_ENV ?? null,
  hasFamilySocialDatabaseUrl,
  hasDatabaseUrl,
});

await ensureAppleClientSecret(childEnv);

if (shouldStart && shouldUseHttps) {
  const hostname = getOptionValue("--hostname") ?? "0.0.0.0";
  const port = Number(getOptionValue("--port") ?? "3000");
  const keyPath = getOptionValue("--experimental-https-key");
  const certPath = getOptionValue("--experimental-https-cert");

  if (!keyPath || !certPath) {
    console.error("HTTPS start mode requires --experimental-https-key and --experimental-https-cert.");
    process.exit(1);
  }

  const app = next({ dev: false, hostname, port });
  const handleRequest = app.getRequestHandler();
  await app.prepare();

  const server = createServer(
    {
      key: readFileSync(resolve(process.cwd(), keyPath)),
      cert: readFileSync(resolve(process.cwd(), certPath)),
    },
    (request, response) => handleRequest(request, response),
  );

  server.listen(port, hostname, () => {
    console.log(`Ready on https://local.my-family-social.com:${ port }`);
  });
} else {
  const nextBinPath = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBinPath, shouldStart ? "start" : "dev", ...nextArgs], {
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
}