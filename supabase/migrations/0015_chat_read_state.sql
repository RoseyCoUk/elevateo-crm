create table chat_read_state (
  user_id uuid not null references users(id) on delete cascade,
  room_id uuid not null references chat_rooms(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, room_id)
);

create index chat_read_state_user_idx on chat_read_state(user_id);

alter table chat_read_state enable row level security;

create policy chat_read_state_self_all on chat_read_state for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
