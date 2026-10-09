-- ترحيل 001: مخطط منصة «أصنع نشاطي»
-- PostgreSQL عبر Supabase — UUID + RLS + فهارس + قيود تحقق

-- ملاحظة: gen_random_uuid() دالة أساسية في PostgreSQL (13+) ولا تحتاج pgcrypto،
-- حتى تبقى الترحيلات قابلة للتطبيق والتحقق على أي Postgres.

-- الملفات الشخصية (مرتبطة بـ auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  role text not null default 'teacher' check (role in ('visitor','teacher','admin')),
  school_name text,
  created_at timestamptz not null default now()
);

-- القوالب العامة
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  activity_type text not null check (activity_type in ('choose-image','matching','classification','ordering','true-false','completion','counting','worksheet')),
  content_json jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);

-- الأنشطة
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  subject text not null,
  skill text not null,
  objective text not null,
  level text,
  activity_type text not null check (activity_type in ('choose-image','matching','classification','ordering','true-false','completion','counting','worksheet')),
  settings_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_activities_owner on activities(owner_id);
create index if not exists idx_activities_type on activities(activity_type);

-- عناصر الأسئلة
create table if not exists activity_items (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  position int not null check (position >= 0),
  question_text text not null,
  content_json jsonb not null default '{}'::jsonb,
  answer_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(activity_id, position)
);
create index if not exists idx_items_activity on activity_items(activity_id);

-- الوسائط
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp','image/svg+xml')),
  alt_text text,
  license_info text not null default 'رفع المعلمة — استخدام تعليمي',
  created_at timestamptz not null default now()
);

-- الرموز المستعارة للطالبات (لا أسماء كاملة)
create table if not exists student_aliases (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  alias text not null check (char_length(alias) between 1 and 30),
  created_at timestamptz not null default now(),
  unique(teacher_id, alias)
);

-- المحاولات
create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  student_alias_id uuid references student_aliases(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score numeric check (score is null or (score >= 0 and score <= 100)),
  status text not null default 'in-progress' check (status in ('in-progress','completed','abandoned')),
  support_level text check (support_level in ('مستقل','تلميح لفظي','تلميح بصري','مساعدة جزئية','مساعدة كلية'))
);
create index if not exists idx_attempts_activity on attempts(activity_id);

-- الاستجابات
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  activity_item_id uuid not null references activity_items(id) on delete cascade,
  response_json jsonb not null default '{}'::jsonb,
  is_correct boolean,
  attempts_count int not null default 1 check (attempts_count >= 1),
  hints_used int not null default 0 check (hints_used >= 0)
);
create index if not exists idx_responses_attempt on responses(attempt_id);

-- إعدادات المعلمة
create table if not exists teacher_settings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null unique references profiles(id) on delete cascade,
  header_json jsonb not null default '{}'::jsonb,
  print_preferences_json jsonb not null default '{}'::jsonb,
  accessibility_preferences_json jsonb not null default '{}'::jsonb
);

-- ===== Row Level Security =====
alter table profiles enable row level security;
alter table templates enable row level security;
alter table activities enable row level security;
alter table activity_items enable row level security;
alter table media_assets enable row level security;
alter table student_aliases enable row level security;
alter table attempts enable row level security;
alter table responses enable row level security;
alter table teacher_settings enable row level security;

-- القراءة العامة للقوالب المنشورة فقط
create policy "public read published templates" on templates for select using (status = 'published');
create policy "admin manage templates" on templates for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- كل معلمة ترى وتدير بياناتها فقط
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own activities" on activities for all using (auth.uid() = owner_id);
create policy "own items via activity" on activity_items for all using (
  exists (select 1 from activities a where a.id = activity_id and a.owner_id = auth.uid())
);
create policy "own media" on media_assets for all using (auth.uid() = owner_id);
create policy "own aliases" on student_aliases for all using (auth.uid() = teacher_id);
create policy "own attempts via activity" on attempts for all using (
  exists (select 1 from activities a where a.id = activity_id and a.owner_id = auth.uid())
);
create policy "own responses via attempt" on responses for all using (
  exists (select 1 from attempts t join activities a on a.id = t.activity_id where t.id = attempt_id and a.owner_id = auth.uid())
);
create policy "own settings" on teacher_settings for all using (auth.uid() = teacher_id);
