-- ترحيل 002: أعمدة التقارير + صلاحيات المديرة + حزمة التخزين
-- يُطبق بعد 001_schema.sql من محرر SQL في Supabase

-- ١) أعمدة إضافية للمحاولات (تعرضها التقارير)
alter table attempts add column if not exists total_questions int;
alter table attempts add column if not exists correct_count int;
alter table attempts add column if not exists hints_used int not null default 0;
alter table attempts add column if not exists tries_total int not null default 0;
alter table attempts add column if not exists duration_sec int not null default 0;
alter table attempts add column if not exists mastery_threshold int not null default 80;
alter table attempts add column if not exists mastered boolean not null default false;
alter table attempts add column if not exists notes text;

-- ٢) المديرة تقرأ كل الأنشطة والمحاولات للإشراف (الإدارة تتم عبر جدول profiles)
create policy "admin read all activities" on activities
  for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin read all attempts" on attempts
  for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ٣) حزمة خاصة لصور المعلمات (غير علنية)
insert into storage.buckets (id, name, public)
values ('teacher-uploads', 'teacher-uploads', false)
on conflict (id) do nothing;

create policy "teachers manage own uploads" on storage.objects
  for all using (
    bucket_id = 'teacher-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'teacher-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
