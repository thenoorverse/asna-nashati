// التحقق من ترحيلات SQL على Postgres حقيقي (PGlite) + اختبار سلوك RLS فعليًا.
// الاستخدام: npm run db:check
// ملاحظة: كائنات Supabase الخاصة (auth.users, storage.*) تُحاكى هنا؛ الباقي يُنفذ حرفيًا.
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const db = new PGlite();
let failures = 0;
const ok = (name) => console.log(`  ✓ ${name}`);
const fail = (name, e) => { failures++; console.log(`  ✗ ${name}: ${String(e?.message ?? e).slice(0, 300)}`); };
process.on("unhandledRejection", (e) => { fail("unhandled", e); console.log("ABORTED"); process.exit(1); });

// ١) محاكاة بيئة Supabase الدنيا
await db.exec(`
  create schema auth;
  create table auth.users(id uuid primary key, email text);
  create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  create schema storage;
  create table storage.buckets(id text primary key, name text, public boolean);
  create table storage.objects(bucket_id text, name text);
  create or replace function storage.foldername(n text) returns text[]
    language sql immutable as $$ select string_to_array(n, '/') $$;
`);
ok("stubs (auth.*, storage.*)");

// ٢) تطبيق الترحيلات الثلاثة حرفيًا
for (const f of ["001_schema.sql", "002_reports_admin_storage.sql", "003_admin_manage.sql"]) {
  try {
    await db.exec(await readFile(path.join(root, "supabase", "migrations", f), "utf8"));
    ok(`migration ${f}`);
  } catch (e) { fail(`migration ${f}`, e); }
}

// ٣) أدوار غير مميزة لاختبار RLS (مالك الجداول يتجاوز RLS، لذا نستخدم SET ROLE)
await db.exec(`create role app_a login; create role app_b login;
  grant usage on schema public, auth, storage to app_a, app_b;
  grant all on all tables in schema public to app_a, app_b;
  grant all on all tables in schema auth to app_a, app_b;
  grant all on all tables in schema storage to app_a, app_b;`);

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const setUid = async (id) => {
  await db.exec(`create or replace function auth.uid() returns uuid language sql stable as $$ select '${id}'::uuid $$;`);
};
const asUser = async (role, id, fn) => {
  await setUid(id);
  await db.exec(`set role ${role};`);
  try { return await fn(); } finally { await db.exec(`reset role;`); }
};

await db.exec(`insert into auth.users(id,email) values ('${A}','a@school.sa'),('${B}','b@school.sa');`);
await db.exec(`insert into profiles(id,display_name,role) values ('${A}','معلمة أ','teacher'),('${B}','معلمة ب','teacher');`);

// أ تنشئ نشاطًا
const actId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
await asUser("app_a", A, () =>
  db.exec(`insert into activities(id,owner_id,title,subject,skill,objective,activity_type)
    values ('${actId}','${A}','نشاط أ','الرياضيات','مهارة','هدف','choose-image')`));
ok("teacher A creates activity");

// أ ترى نشاطها
const seenA = await asUser("app_a", A, () => db.query(`select id from activities`));
(seenA.rows.length === 1 ? ok : fail)("A sees own activity (1 row)", `got ${seenA.rows.length}`);

// ب لا ترى نشاط أ (عزل RLS)
const seenB = await asUser("app_b", B, () => db.query(`select id from activities`));
(seenB.rows.length === 0 ? ok : fail)("B cannot see A's activity (0 rows)", `got ${seenB.rows.length}`);

// ب لا تستطيع الحذف
try {
  await asUser("app_b", B, () => db.exec(`delete from activities where id='${actId}'`));
  const still = await asUser("app_a", A, () => db.query(`select id from activities where id='${actId}'`));
  (still.rows.length === 1 ? ok : fail)("B delete blocked (row survives)", "row gone!");
} catch (e) { ok("B delete blocked (statement rejected)"); }

// ب لا تستطيع النسبة لمالك آخر (WITH CHECK)
try {
  await asUser("app_b", B, () =>
    db.exec(`insert into activities(id,owner_id,title,subject,skill,objective,activity_type)
      values (gen_random_uuid(),'${A}','تزوير','الرياضيات','م','ه','counting')`));
  fail("B spoof insert", "was allowed!");
} catch { ok("B spoof insert rejected (WITH CHECK)"); }

// القوالب المنشورة عامة
await db.exec(`insert into templates(title,subject,activity_type,status) values ('قالب عام','العلوم','matching','published')`);
const tplB = await asUser("app_b", B, () => db.query(`select title from templates`));
(tplB.rows.length === 1 ? ok : fail)("published templates publicly readable", `got ${tplB.rows.length}`);

// المسودة غير المنشورة محجوبة عن العموم
await db.exec(`insert into templates(title,subject,activity_type,status) values ('مسودة','العلوم','matching','draft')`);
const tplB2 = await asUser("app_b", B, () => db.query(`select title from templates`));
(tplB2.rows.length === 1 ? ok : fail)("draft templates hidden", `got ${tplB2.rows.length}`);

// ترقية ب لمديرة: ترى كل شيء
await db.exec(`update profiles set role='admin' where id='${B}'`);
const seenAdmin = await asUser("app_b", B, () => db.query(`select id from activities`));
(seenAdmin.rows.length === 1 ? ok : fail)("admin sees all activities", `got ${seenAdmin.rows.length}`);

// قيود التحقق: عنوان قصير مرفوض
try {
  await asUser("app_a", A, () =>
    db.exec(`insert into activities(owner_id,title,subject,skill,objective,activity_type)
      values ('${A}','أ','الرياضيات','م','ه','counting')`));
  fail("check constraint title length", "was allowed!");
} catch { ok("check constraint title length enforced"); }

// عناصر + محاولة + استجابة (سلامة العلاقات)
const itemId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
await asUser("app_a", A, async () => {
  await db.exec(`insert into activity_items(id,activity_id,position,question_text) values ('${itemId}','${actId}',0,'س؟')`);
  await db.exec(`insert into student_aliases(teacher_id,alias) values ('${A}','نجمة ١')`);
});
ok("items + aliases insert (FK integrity)");

console.log(failures === 0 ? "\nALL SQL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
