-- DENBROWN PHOTO SELECTION: sửa lỗi thiếu cột allow_download
-- Chạy toàn bộ nội dung này trong Supabase > SQL Editor > New query.
-- Lệnh IF NOT EXISTS an toàn khi chạy nhiều lần và không xóa album/ảnh hiện có.

alter table public.denbrown_albums
  add column if not exists allow_download boolean not null default true;

alter table public.denbrown_albums
  add column if not exists allow_notes boolean not null default true;

alter table public.denbrown_albums
  add column if not exists selection_limit integer not null default 0;

alter table public.denbrown_photos
  add column if not exists drive_file_id text;

create table if not exists public.denbrown_album_notes (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.denbrown_albums(id) on delete cascade,
  client_id text not null,
  note text not null check (length(note) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.denbrown_album_notes enable row level security;

drop policy if exists "customer notes insert" on public.denbrown_album_notes;
create policy "customer notes insert"
  on public.denbrown_album_notes for insert to anon, authenticated
  with check (
    length(client_id) > 10
    and exists (
      select 1 from public.denbrown_albums a
      where a.id = album_id and a.status = 'active'
        and a.expires_at > now() and a.allow_notes = true
    )
  );

drop policy if exists "owner notes read" on public.denbrown_album_notes;
create policy "owner notes read"
  on public.denbrown_album_notes for select to authenticated
  using (
    exists (
      select 1 from public.denbrown_albums a
      where a.id = album_id and a.owner_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
