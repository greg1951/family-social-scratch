create table if not exists pwa_mutation_request (
  id serial primary key,
  request_key text not null unique,
  mutation_name text not null,
  entity_type text,
  entity_id integer,
  fk_family_id integer not null references family(id) on delete cascade,
  fk_member_id integer not null references member(id) on delete cascade,
  created_at timestamp default now()
);

create index if not exists pwa_mutation_request_family_id_idx
  on pwa_mutation_request (fk_family_id);

create index if not exists pwa_mutation_request_member_id_idx
  on pwa_mutation_request (fk_member_id);