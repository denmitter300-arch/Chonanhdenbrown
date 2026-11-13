create extension if not exists pgcrypto;
create table if not exists public.denbrown_albums(id uuid primary key default gen_random_uuid(),title text not null,slug text unique not null,note text default '',owner_id uuid not null references auth.users(id) on delete cascade,status text not null default 'active' check(status in('active','locked')),expires_at timestamptz not null,created_at timestamptz default now());
create table if not exists public.denbrown_photos(id uuid primary key default gen_random_uuid(),album_id uuid not null references public.denbrown_albums(id) on delete cascade,file_name text not null,storage_path text not null,public_url text not null,created_at timestamptz default now());
create table if not exists public.denbrown_selections(id uuid primary key default gen_random_uuid(),album_id uuid not null references public.denbrown_albums(id) on delete cascade,photo_id uuid not null references public.denbrown_photos(id) on delete cascade,client_id text not null,created_at timestamptz default now(),unique(album_id,photo_id,client_id));
alter table public.denbrown_albums enable row level security; alter table public.denbrown_photos enable row level security; alter table public.denbrown_selections enable row level security;
drop policy if exists "album public read" on public.denbrown_albums; create policy "album public read" on public.denbrown_albums for select to anon,authenticated using ((status='active' and expires_at>now()) or owner_id=auth.uid());
drop policy if exists "album owner all" on public.denbrown_albums; create policy "album owner all" on public.denbrown_albums for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists "photo public read" on public.denbrown_photos; create policy "photo public read" on public.denbrown_photos for select to anon,authenticated using(exists(select 1 from public.denbrown_albums a where a.id=album_id and a.status='active' and a.expires_at>now()) or exists(select 1 from public.denbrown_albums a where a.id=album_id and a.owner_id=auth.uid()));
drop policy if exists "photo owner insert" on public.denbrown_photos; create policy "photo owner insert" on public.denbrown_photos for insert to authenticated with check(exists(select 1 from public.denbrown_albums a where a.id=album_id and a.owner_id=auth.uid()));
drop policy if exists "photo owner delete" on public.denbrown_photos; create policy "photo owner delete" on public.denbrown_photos for delete to authenticated using(exists(select 1 from public.denbrown_albums a where a.id=album_id and a.owner_id=auth.uid()));
drop policy if exists "selection public read" on public.denbrown_selections; create policy "selection public read" on public.denbrown_selections for select to anon,authenticated using(true);
drop policy if exists "selection public insert" on public.denbrown_selections; create policy "selection public insert" on public.denbrown_selections for insert to anon,authenticated with check(exists(select 1 from public.denbrown_albums a where a.id=album_id and a.status='active' and a.expires_at>now()) and exists(select 1 from public.denbrown_photos p where p.id=photo_id and p.album_id=album_id));
drop policy if exists "selection public delete" on public.denbrown_selections; create policy "selection public delete" on public.denbrown_selections for delete to anon,authenticated using(length(client_id)>10);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('denbrown-photos','denbrown-photos',true,20971520,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=true,file_size_limit=20971520;
drop policy if exists "public view photo storage" on storage.objects; create policy "public view photo storage" on storage.objects for select to anon,authenticated using(bucket_id='denbrown-photos');
drop policy if exists "owner upload photo storage" on storage.objects; create policy "owner upload photo storage" on storage.objects for insert to authenticated with check(bucket_id='denbrown-photos' and exists(select 1 from public.denbrown_albums a where a.id::text=(storage.foldername(name))[1] and a.owner_id=auth.uid()));
drop policy if exists "owner delete photo storage" on storage.objects; create policy "owner delete photo storage" on storage.objects for delete to authenticated using(bucket_id='denbrown-photos' and exists(select 1 from public.denbrown_albums a where a.id::text=(storage.foldername(name))[1] and a.owner_id=auth.uid()));

-- DENBROWN feature upgrade: password, Google Drive references, selection limit and customer notes
alter table public.denbrown_albums add column if not exists password_hash text;
alter table public.denbrown_albums add column if not exists drive_folder_url text default '';
alter table public.denbrown_albums add column if not exists allow_download boolean not null default true;
alter table public.denbrown_albums add column if not exists allow_notes boolean not null default true;
alter table public.denbrown_albums add column if not exists selection_limit integer not null default 0 check(selection_limit>=0);
alter table public.denbrown_photos add column if not exists drive_file_id text;
create table if not exists public.denbrown_album_notes(
 id uuid primary key default gen_random_uuid(),
 album_id uuid not null references public.denbrown_albums(id) on delete cascade,
 client_id text not null,
 note text not null check(length(note)<=2000),
 created_at timestamptz not null default now()
);
alter table public.denbrown_album_notes enable row level security;
drop policy if exists "album public read" on public.denbrown_albums;
create policy "album public read" on public.denbrown_albums for select to anon,authenticated
 using ((status='active' and expires_at>now() and password_hash is null) or owner_id=auth.uid());
drop policy if exists "album owner all" on public.denbrown_albums;
create policy "album owner all" on public.denbrown_albums for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create or replace function public.get_public_album(p_slug text,p_password_hash text)
returns jsonb language sql security definer set search_path=public
as $$
 select jsonb_build_object('id',id,'title',title,'slug',slug,'note',note,'status',status,'expires_at',expires_at,
 'allow_download',allow_download,'allow_notes',allow_notes,'selection_limit',selection_limit)
 from public.denbrown_albums
 where slug=p_slug and status='active' and expires_at>now()
 and ((password_hash is null and p_password_hash is null) or password_hash=p_password_hash)
 limit 1;
$$;
grant execute on function public.get_public_album(text,text) to anon,authenticated;
drop policy if exists "customer notes insert" on public.denbrown_album_notes;
create policy "customer notes insert" on public.denbrown_album_notes for insert to anon,authenticated
 with check(length(client_id)>10 and exists(select 1 from public.denbrown_albums a where a.id=album_id and a.status='active' and a.expires_at>now() and a.allow_notes=true));
drop policy if exists "owner notes read" on public.denbrown_album_notes;
create policy "owner notes read" on public.denbrown_album_notes for select to authenticated
 using(exists(select 1 from public.denbrown_albums a where a.id=album_id and a.owner_id=auth.uid()));
create or replace function public.enforce_denbrown_selection_limit()
returns trigger language plpgsql security definer set search_path=public
as $$
declare lim integer; current_count integer;
begin
 select selection_limit into lim from public.denbrown_albums where id=new.album_id and status='active' and expires_at>now();
 if not found then raise exception 'Album không hoạt động hoặc đã hết hạn'; end if;
 if lim>0 then
  select count(*) into current_count from public.denbrown_selections where album_id=new.album_id and client_id=new.client_id;
  if current_count>=lim then raise exception 'Album chỉ cho phép chọn tối đa % ảnh',lim; end if;
 end if;
 return new;
end; $$;
drop trigger if exists denbrown_selection_limit on public.denbrown_selections;
create trigger denbrown_selection_limit before insert on public.denbrown_selections for each row execute function public.enforce_denbrown_selection_limit();
