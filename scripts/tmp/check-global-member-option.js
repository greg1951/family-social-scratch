require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

(async () => {
  const client = new Client({ connectionString: process.env.FAMILY_SOCIAL_DATABASE_URL });
  await client.connect();

  const memberOptionResult = await client.query(
    "select table_schema, table_name from information_schema.tables where table_schema = 'global_schema' and table_name = 'member_option_reference'"
  );
  const relationResult = await client.query(
    "select n.nspname as schema_name, c.relname as relation_name, c.relkind as relation_kind from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'global_schema' and c.relname = 'member_option_reference' order by c.relkind"
  );
  const columnResult = await client.query(
    "select table_schema, table_name, column_name, data_type from information_schema.columns where table_schema = 'global_schema' and table_name = 'member_option_reference' order by ordinal_position"
  );
  const globalTablesResult = await client.query(
    "select table_name from information_schema.tables where table_schema = 'global_schema' order by table_name"
  );

  console.log(JSON.stringify({
    databaseUrlHost: new URL(process.env.FAMILY_SOCIAL_DATABASE_URL).hostname,
    databaseName: new URL(process.env.FAMILY_SOCIAL_DATABASE_URL).pathname.replace(/^\//, ""),
    memberOptionReference: memberOptionResult.rows,
    memberOptionReferenceRelations: relationResult.rows,
    memberOptionReferenceColumns: columnResult.rows,
    globalSchemaTables: globalTablesResult.rows,
  }, null, 2));

  await client.end();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
