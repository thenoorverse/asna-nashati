-- ترحيل 003: إدارة المديرة الكاملة لجميع الأنشطة والمحاولات
-- يُطبق بعد 002 من محرر SQL في Supabase

create policy "admin manage all activities" on activities for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admin manage all items" on activity_items for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admin manage all attempts" on attempts for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
