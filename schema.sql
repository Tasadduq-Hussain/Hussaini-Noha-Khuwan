-- Supabase setup for Hussaini Noha Khuwan
create extension if not exists pgcrypto;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text
);

create table if not exists public.nohas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  reciter text,
  category text default 'Other',
  lyrics text default '',
  keywords text default '',
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
alter table public.nohas enable row level security;

drop policy if exists "public read nohas" on public.nohas;
create policy "public read nohas" on public.nohas for select using (true);

drop policy if exists "admins insert nohas" on public.nohas;
create policy "admins insert nohas" on public.nohas for insert to authenticated with check (exists(select 1 from public.admins a where a.user_id=auth.uid()));

drop policy if exists "admins update nohas" on public.nohas;
create policy "admins update nohas" on public.nohas for update to authenticated using (exists(select 1 from public.admins a where a.user_id=auth.uid())) with check (exists(select 1 from public.admins a where a.user_id=auth.uid()));

drop policy if exists "admins delete nohas" on public.nohas;
create policy "admins delete nohas" on public.nohas for delete to authenticated using (exists(select 1 from public.admins a where a.user_id=auth.uid()));

insert into storage.buckets (id,name,public) values ('noha-images','noha-images',true)
on conflict (id) do update set public=true;

drop policy if exists "public read noha images" on storage.objects;
create policy "public read noha images" on storage.objects for select using (bucket_id='noha-images');

drop policy if exists "admins upload noha images" on storage.objects;
create policy "admins upload noha images" on storage.objects for insert to authenticated with check (bucket_id='noha-images' and exists(select 1 from public.admins a where a.user_id=auth.uid()));

drop policy if exists "admins update noha images" on storage.objects;
create policy "admins update noha images" on storage.objects for update to authenticated using (bucket_id='noha-images' and exists(select 1 from public.admins a where a.user_id=auth.uid()));

drop policy if exists "admins delete noha images" on storage.objects;
create policy "admins delete noha images" on storage.objects for delete to authenticated using (bucket_id='noha-images' and exists(select 1 from public.admins a where a.user_id=auth.uid()));

-- After creating your admin user in Authentication > Users, run:
-- insert into public.admins(user_id,email) values ('YOUR-AUTH-USER-UUID','your@email.com');
