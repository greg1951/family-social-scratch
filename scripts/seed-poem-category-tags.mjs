import fs from "node:fs";
import path from "node:path";

import pg from "pg";

const { Client } = pg;

function normalizeDatabaseUrl(connectionString) {
  const normalizedUrl = new URL(connectionString);
  const sslMode = normalizedUrl.searchParams.get("sslmode");

  if (!sslMode || ["require", "prefer", "verify-ca"].includes(sslMode)) {
    normalizedUrl.searchParams.set("sslmode", "verify-full");
  }

  return normalizedUrl.toString();
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();

    if (!key || process.env[key]) {
      continue;
    }

    const valueWithoutComment = rawValue.split(" #")[0].trim();
    const unquotedValue = valueWithoutComment.replace(/^"|"$/g, "");

    process.env[key] = unquotedValue;
  }
}

function tiptapDocFromParagraphs(paragraphs) {
  return JSON.stringify({
    type: "doc",
    content: paragraphs.map((paragraph) => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph }],
    })),
  });
}

async function assertExpectedColumns(client) {
  const result = await client.query(
    `select table_name, column_name
     from information_schema.columns
     where table_schema = 'public'
       and (
         (table_name = 'poem_category_reference' and column_name in ('id', 'category_name', 'category_description', 'updated_at'))
         or
         (table_name = 'poem_category_tag_reference' and column_name in ('id', 'tag_name', 'tag_json', 'updated_at', 'fk_poem_category_id'))
       )`
  );

  const columnsByTable = new Map();

  for (const row of result.rows) {
    const tableName = row.table_name;
    const columnName = row.column_name;

    if (!columnsByTable.has(tableName)) {
      columnsByTable.set(tableName, new Set());
    }

    columnsByTable.get(tableName).add(columnName);
  }

  const categoryColumns = columnsByTable.get("poem_category_reference") ?? new Set();
  const tagColumns = columnsByTable.get("poem_category_tag_reference") ?? new Set();

  const requiredCategoryColumns = ["id", "category_name", "category_description", "updated_at"];
  const requiredTagColumns = ["id", "tag_name", "tag_json", "updated_at", "fk_poem_category_id"];

  for (const column of requiredCategoryColumns) {
    if (!categoryColumns.has(column)) {
      throw new Error(`Missing expected column poem_category_reference.${column}`);
    }
  }

  for (const column of requiredTagColumns) {
    if (!tagColumns.has(column)) {
      throw new Error(`Missing expected column poem_category_tag_reference.${column}`);
    }
  }
}

async function upsertSingleCategory(client, categoryName, categoryDesc) {
  const categoryResult = await client.query(
    `select id
     from poem_category_reference
     where category_name = $1
     order by id asc`,
    [categoryName]
  );

  let categoryId;

  if (categoryResult.rowCount > 0) {
    categoryId = categoryResult.rows[0].id;

    await client.query(
      `update poem_category_reference
       set category_description = $1,
           updated_at = now()
       where id = $2`,
      [categoryDesc, categoryId]
    );

    if (categoryResult.rowCount > 1) {
      const duplicateIds = categoryResult.rows.slice(1).map((row) => row.id);

      await client.query(
        `delete from poem_category_tag_reference
         where fk_poem_category_id = any($1::int[])`,
        [duplicateIds]
      );

      await client.query(
        `delete from poem_category_reference
         where id = any($1::int[])`,
        [duplicateIds]
      );
    }
  } else {
    const insertCategory = await client.query(
      `insert into poem_category_reference (category_name, category_description, updated_at)
       values ($1, $2, now())
       returning id`,
      [categoryName, categoryDesc]
    );

    categoryId = insertCategory.rows[0].id;
  }

  return categoryId;
}

async function upsertCategoryTag(client, categoryId, tagName, tagJson) {
  const tagResult = await client.query(
    `select id
     from poem_category_tag_reference
     where fk_poem_category_id = $1
       and tag_name = $2
     order by id asc`,
    [categoryId, tagName]
  );

  if (tagResult.rowCount > 0) {
    const tagId = tagResult.rows[0].id;

    await client.query(
      `update poem_category_tag_reference
       set tag_json = $1,
           updated_at = now()
       where id = $2`,
      [tagJson, tagId]
    );

    if (tagResult.rowCount > 1) {
      const duplicateIds = tagResult.rows.slice(1).map((row) => row.id);

      await client.query(
        `delete from poem_category_tag_reference
         where id = any($1::int[])`,
        [duplicateIds]
      );
    }

    return tagId;
  }

  const insertTag = await client.query(
    `insert into poem_category_tag_reference (tag_name, tag_json, updated_at, fk_poem_category_id)
     values ($1, $2, now(), $3)
     returning id`,
    [tagName, tagJson, categoryId]
  );

  return insertTag.rows[0].id;
}

async function main() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));

  const rawConnectionString = process.env.FAMILY_SOCIAL_DATABASE_URL || process.env.DATABASE_URL;

  if (!rawConnectionString) {
    throw new Error("Set FAMILY_SOCIAL_DATABASE_URL or DATABASE_URL before running this seed.");
  }

  const client = new Client({ connectionString: normalizeDatabaseUrl(rawConnectionString) });

  const categorySeed = {
    categoryName: "Poetry Forms (Fixture)",
    categoryDesc: "Seeded fixture category for add-poem-tags UI validation.",
  };

  const tagSeeds = [
    {
      tagName: "Sonnet",
      tagJson: tiptapDocFromParagraphs([
        "A 14-line poem, often written in iambic pentameter.",
        "Common structures include Shakespearean and Petrarchan forms.",
      ]),
    },
    {
      tagName: "Haiku",
      tagJson: tiptapDocFromParagraphs([
        "A concise 3-line form traditionally following a 5-7-5 syllable pattern.",
        "Often focused on nature, seasons, or a single observed moment.",
      ]),
    },
  ];

  await client.connect();

  try {
    await assertExpectedColumns(client);

    await client.query("begin");

    const categoryId = await upsertSingleCategory(
      client,
      categorySeed.categoryName,
      categorySeed.categoryDesc
    );

    const tagIds = [];

    for (const tagSeed of tagSeeds) {
      const tagId = await upsertCategoryTag(
        client,
        categoryId,
        tagSeed.tagName,
        tagSeed.tagJson
      );

      tagIds.push(tagId);
    }

    await client.query(
      `delete from poem_category_tag_reference
       where fk_poem_category_id = $1
         and tag_name <> all($2::text[])`,
      [categoryId, tagSeeds.map((tag) => tag.tagName)]
    );

    const countsResult = await client.query(
      `select
         (select count(*)::int from poem_category_reference where id = $1) as category_count,
         (select count(*)::int from poem_category_tag_reference where fk_poem_category_id = $1) as tag_count`,
      [categoryId]
    );

    const counts = countsResult.rows[0];

    if (counts.category_count !== 1) {
      throw new Error(`Expected exactly 1 category row, found ${counts.category_count}.`);
    }

    if (counts.tag_count !== tagSeeds.length) {
      throw new Error(`Expected exactly ${tagSeeds.length} tag rows, found ${counts.tag_count}.`);
    }

    await client.query("commit");

    console.log(
      JSON.stringify(
        {
          success: true,
          categoryId,
          categoryName: categorySeed.categoryName,
          categoryCount: counts.category_count,
          tagCount: counts.tag_count,
          tagIds,
          tagsSeeded: tagSeeds.map((tag) => tag.tagName),
        },
        null,
        2
      )
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
