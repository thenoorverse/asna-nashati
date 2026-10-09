# تفعيل Supabase (اختياري — المنصة تعمل بدونه في وضع Demo)

## ١. إنشاء المشروع
1. أنشئي مشروعًا في https://supabase.com
2. من لوحة المشروع انسخي: `Project URL` و `anon public key`.

## ٢. الإعداد المحلي
```bash
cp .env.example .env.local
# عبّئي:
# NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## ٣. تطبيق الترحيلات
افتحي **SQL Editor** في Supabase والصقي بالترتيب:
- `supabase/migrations/001_schema.sql` (الجداول + RLS)
- `supabase/migrations/002_reports_admin_storage.sql` (أعمدة التقارير + صلاحيات المديرة + حزمة `teacher-uploads`)
- `supabase/migrations/003_admin_manage.sql` (إدارة المديرة الكاملة)

أو عبر CLI:
```bash
supabase db push
```

## ٤. التخزين (رفع صور المعلمة)
أنشئي Bucket باسم `teacher-uploads` خاصًا (Private)، مع سياسة:
- القراءة/الكتابة لمالك الملف فقط (`auth.uid()` كمجلد جذري).
- أنواع مسموحة: `image/png, image/jpeg, image/webp, image/svg+xml` — حد أقصى ٢ م.ب (يُتحقق منه في الواجهة أيضًا).

## ٥. ملاحظات
- بدون المفاتيح يعمل التطبيق تلقائيًا في وضع Demo المحلي (localStorage).
- لا تضعي `SUPABASE_SERVICE_ROLE_KEY` في كود الواجهة أبدًا.
- لا تستخدمي بيانات طالبات حقيقية في الاختبارات.
- **ترقية مديرة**: سجّلي أول حساب من صفحة الدخول، ثم نفّذي في SQL Editor:
  ```sql
  update profiles set role = 'admin'
  where id = (select id from auth.users where email = 'admin@school.sa');
  ```
  بعدها يظهر رابط «الإدارة» في القائمة.
