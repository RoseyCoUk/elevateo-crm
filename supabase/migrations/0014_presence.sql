alter table users add column if not exists last_seen_at timestamptz;
alter table users add column if not exists presence_status text;
