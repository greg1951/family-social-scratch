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

function tiptapParagraph(text) {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: text ? [{ type: "text", text }] : undefined,
      },
    ],
  });
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

async function main() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));

  const rawConnectionString = process.env.FAMILY_SOCIAL_DATABASE_URL || process.env.DATABASE_URL;

  if (!rawConnectionString) {
    throw new Error("Set FAMILY_SOCIAL_DATABASE_URL or DATABASE_URL before running the Book Besties seed.");
  }

  const client = new Client({ connectionString: normalizeDatabaseUrl(rawConnectionString) });

  const tagSeeds = [
    { tagName: "Classic", tagDesc: "Well-known and enduring titles.", seqNo: 1 },
    { tagName: "Memoir", tagDesc: "Personal stories and lived experiences.", seqNo: 2 },
    { tagName: "Sci-Fi", tagDesc: "Speculative and futuristic stories.", seqNo: 3 },
    { tagName: "Family Favorite", tagDesc: "Loved by multiple family members.", seqNo: 4 },
  ];

  const termSeeds = [
    {
      term: "Narrator",
      termJson: tiptapParagraph("The voice or character through which the story is told."),
      status: "published",
    },
    {
      term: "Theme",
      termJson: tiptapParagraph("A central idea, message, or underlying meaning in a book."),
      status: "published",
    },
    {
      term: "Pacing",
      termJson: tiptapParagraph("How quickly or slowly events unfold in the narrative."),
      status: "draft",
    },
  ];

  const bookSeeds = [
    {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      language: "English",
      year: 1937,
      status: "published",
      analysis: tiptapParagraph("A classic adventure that blends whimsy, danger, and growth."),
      tags: ["Classic", "Family Favorite"],
      comments: ["Great world-building and memorable characters."],
    },
    {
      title: "Project Hail Mary",
      author: "Andy Weir",
      language: "English",
      year: 2021,
      status: "published",
      analysis: tiptapParagraph("Fast-paced science fiction with a strong problem-solving core."),
      tags: ["Sci-Fi"],
      comments: ["Loved the blend of science and humor."],
    },
    {
      title: "Educated",
      author: "Tara Westover",
      language: "English",
      year: 2018,
      status: "published",
      analysis: tiptapParagraph("A compelling memoir about identity, education, and resilience."),
      tags: ["Memoir", "Family Favorite"],
      comments: ["Powerful personal story and reflection."],
    },
  ];

  await client.connect();

  try {
    await client.query("BEGIN");

    const memberResult = await client.query(
      "select id, fk_family_id as family_id from member where status = 'active' order by id asc limit 1"
    );

    if (!memberResult.rowCount || !memberResult.rows[0]) {
      throw new Error("No active member found. Create at least one member before seeding Book Besties data.");
    }

    const memberId = memberResult.rows[0].id;
    const familyId = memberResult.rows[0].family_id;

    for (const tag of tagSeeds) {
      const existingTag = await client.query(
        "select id from book_tag_reference where tag_name = $1 order by id asc limit 1",
        [tag.tagName]
      );

      if (existingTag.rowCount && existingTag.rows[0]?.id) {
        await client.query(
          "update book_tag_reference set tag_description = $1, status = 'active', seq_no = $2 where id = $3",
          [tag.tagDesc, tag.seqNo, existingTag.rows[0].id]
        );
      } else {
        await client.query(
          "insert into book_tag_reference (tag_name, tag_description, status, seq_no) values ($1, $2, 'active', $3)",
          [tag.tagName, tag.tagDesc, tag.seqNo]
        );
      }
    }

    for (const term of termSeeds) {
      const existingTerm = await client.query(
        "select id from book_term where term = $1 order by id asc limit 1",
        [term.term]
      );

      if (existingTerm.rowCount && existingTerm.rows[0]?.id) {
        await client.query(
          "update book_term set term_json = $1, status = $2 where id = $3",
          [term.termJson, term.status, existingTerm.rows[0].id]
        );
      } else {
        await client.query(
          "insert into book_term (term, term_json, status) values ($1, $2, $3)",
          [term.term, term.termJson, term.status]
        );
      }
    }

    for (const seedBook of bookSeeds) {
      const upsertBookResult = await client.query(
        `insert into book (book_title, author_name, book_language, book_year, status, fk_member_id, fk_family_id)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (book_title) do update
         set author_name = excluded.author_name,
             book_language = excluded.book_language,
             book_year = excluded.book_year,
             status = excluded.status,
             fk_member_id = excluded.fk_member_id,
             fk_family_id = excluded.fk_family_id
         returning id`,
        [
          seedBook.title,
          seedBook.author,
          seedBook.language,
          seedBook.year,
          seedBook.status,
          memberId,
          familyId,
        ]
      );

      const bookId = upsertBookResult.rows[0].id;

      await client.query(
        `insert into book_comment (is_book_analysis, comment_json, fk_book_id, fk_member_id)
         values (true, $1, $2, $3)
         on conflict do nothing`,
        [seedBook.analysis, bookId, memberId]
      );

      const analysisResult = await client.query(
        `select id from book_comment
         where fk_book_id = $1 and is_book_analysis = true
         order by id asc
         limit 1`,
        [bookId]
      );

      if (analysisResult.rowCount && analysisResult.rows[0]?.id) {
        await client.query(
          "update book_comment set comment_json = $1 where id = $2",
          [seedBook.analysis, analysisResult.rows[0].id]
        );
      }

      await client.query("delete from book_fact_tag where fk_book_id = $1", [bookId]);

      for (const tagName of seedBook.tags) {
        const tagResult = await client.query(
          "select id from book_tag_reference where tag_name = $1 limit 1",
          [tagName]
        );

        if (!tagResult.rowCount || !tagResult.rows[0]?.id) {
          continue;
        }

        await client.query(
          "insert into book_fact_tag (fk_book_id, fk_tag_id) values ($1, $2)",
          [bookId, tagResult.rows[0].id]
        );
      }

      await client.query("delete from book_comment where fk_book_id = $1 and is_book_analysis = false", [bookId]);

      for (const comment of seedBook.comments) {
        await client.query(
          "insert into book_comment (is_book_analysis, comment_json, fk_book_id, fk_member_id) values (false, $1, $2, $3)",
          [tiptapParagraph(comment), bookId, memberId]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Book Besties seed completed: tags, terms, books, analysis, and comments are now populated.");
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
