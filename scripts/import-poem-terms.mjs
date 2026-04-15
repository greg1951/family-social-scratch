import fs from "node:fs";
import path from "node:path";

import pg from "pg";

const { Client } = pg;

function parseCsv(content) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      }
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

function getRecords(rows) {
  const [header = [], ...dataRows] = rows;

  return dataRows
    .filter((row) => row.some((value) => value.trim().length > 0))
    .map((row) => {
      const record = {};

      header.forEach((column, index) => {
        const normalizedColumn = column.replace(/^"|"$/g, "");
        record[normalizedColumn] = row[index] ?? "";
      });

      return record;
    });
}

function normalizeDatabaseUrl(connectionString) {
  const normalizedUrl = new URL(connectionString);
  const sslMode = normalizedUrl.searchParams.get("sslmode");

  if (!sslMode || ["require", "prefer", "verify-ca"].includes(sslMode)) {
    normalizedUrl.searchParams.set("sslmode", "verify-full");
  }

  return normalizedUrl.toString();
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const rawConnectionString =
    process.env.FAMILY_SOCIAL_DATABASE_URL || process.env.DATABASE_URL;

  const csvPath = path.resolve(process.cwd(), "docs", "insert-poem_term.csv");
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const records = getRecords(parseCsv(csvContent));

  if (records.length === 0) {
    throw new Error("No poem term records were found in docs/insert-poem_term.csv.");
  }

  for (const record of records) {
    const term = record.term?.trim();
    const termJson = record.term_json?.trim();

    if (!term || !termJson) {
      throw new Error(`Invalid poem term row: ${JSON.stringify(record)}`);
    }

    JSON.parse(termJson);
  }

  if (isDryRun) {
    console.log(`Validated ${records.length} poem terms from docs/insert-poem_term.csv.`);
    return;
  }

  if (!rawConnectionString) {
    throw new Error(
      "Set FAMILY_SOCIAL_DATABASE_URL or DATABASE_URL before running the poem term importer."
    );
  }

  const client = new Client({ connectionString: normalizeDatabaseUrl(rawConnectionString) });

  await client.connect();

  try {
    await client.query("BEGIN");

    let insertedCount = 0;
    let updatedCount = 0;

    for (const record of records) {
      const term = record.term?.trim();
      const termJson = record.term_json?.trim();
      const status = record.status?.trim() || "draft";

      const existing = await client.query(
        "select id from poem_term where term = $1 order by id asc limit 1",
        [term]
      );

      if (existing.rowCount && existing.rows[0]?.id) {
        await client.query(
          "update poem_term set term_json = $1, status = $2 where id = $3",
          [termJson, status, existing.rows[0].id]
        );
        updatedCount += 1;
      } else {
        await client.query(
          "insert into poem_term (term, term_json, status) values ($1, $2, $3)",
          [term, termJson, status]
        );
        insertedCount += 1;
      }
    }

    await client.query("COMMIT");

    console.log(
      `Imported ${records.length} poem terms (${insertedCount} inserted, ${updatedCount} updated).`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});