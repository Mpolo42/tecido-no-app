-- No production user identity is embedded in migrations. Bootstrap the approved
-- administrator separately after verifying the account (see the deployment guide).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke all on sequences from public, anon, authenticated;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.admin_users enable row level security;
revoke all on private.admin_users from public, anon, authenticated, service_role;

-- These definer helpers are private, check the caller identity, and expose only a
-- boolean. Neither the role table nor its rows are granted to browser roles.
create function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from private.admin_users as administrators
    where administrators.user_id = auth.uid()
  );
$$;
revoke all on function private.is_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_admin() to authenticated;

create function private.is_admin_aal2()
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_admin() and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;
revoke all on function private.is_admin_aal2() from public, anon, authenticated, service_role;
grant execute on function private.is_admin_aal2() to authenticated;

-- AAL1 membership check is required to decide whether to offer MFA enrollment.
-- This RPC does not grant access to patients or files.
create function public.admin_access()
returns boolean language sql stable security invoker set search_path = ''
as $$ select private.is_admin(); $$;
revoke all on function public.admin_access() from public, anon, authenticated, service_role;
grant execute on function public.admin_access() to authenticated;

alter table public.pacientes add column foto_path text;
alter table public.pacientes add column consent_version text;
alter table public.pacientes add column consent_accepted_at timestamptz;
alter table public.pacientes add column intake_request_id uuid unique;

-- Only recognize the known project's exact legacy public-storage prefix. Do not
-- fetch files, rewrite clinical values, invent consent timestamps, or trust a URL
-- from any other host. The strict suffix excludes queries and traversal segments.
update public.pacientes
set foto_path = substring(foto_url from length('https://rmgjmyxazwzgfztastqx.supabase.co/storage/v1/object/public/fotos-lesoes/') + 1)
where foto_path is null
  and starts_with(foto_url, 'https://rmgjmyxazwzgfztastqx.supabase.co/storage/v1/object/public/fotos-lesoes/')
  and substring(foto_url from length('https://rmgjmyxazwzgfztastqx.supabase.co/storage/v1/object/public/fotos-lesoes/') + 1) ~ '^[A-Za-z0-9_-][A-Za-z0-9_./-]*$'
  and char_length(substring(foto_url from length('https://rmgjmyxazwzgfztastqx.supabase.co/storage/v1/object/public/fotos-lesoes/') + 1)) <= 500
  and substring(foto_url from length('https://rmgjmyxazwzgfztastqx.supabase.co/storage/v1/object/public/fotos-lesoes/') + 1) !~ '(^|/)\.{1,2}(/|$)'
  and right(foto_url, 1) <> '/'
  and position('//' in substring(foto_url from length('https://rmgjmyxazwzgfztastqx.supabase.co/storage/v1/object/public/fotos-lesoes/') + 1)) = 0;

-- NOT VALID preserves historical rows with invalid age/phone. PostgreSQL still
-- enforces each check on every new row and every future updated row.
alter table public.pacientes
  add constraint pacientes_nome_check check (char_length(btrim(nome)) between 2 and 150) not valid,
  add constraint pacientes_nome_social_check check (nome_social is null or char_length(btrim(nome_social)) between 2 and 150) not valid,
  add constraint pacientes_idade_check check (idade between 1 and 120) not valid,
  add constraint pacientes_sexo_check check (sexo in ('M', 'F', 'Outro')) not valid,
  add constraint pacientes_diabetes_check check (tipo_diabetes in ('Tipo 1', 'Tipo 2')) not valid,
  add constraint pacientes_grau_check check (grau_lesao in ('Grau 1', 'Grau 2', 'Grau 3', 'Grau 4', 'Grau 5')) not valid,
  add constraint pacientes_tempo_check check (char_length(btrim(tempo_lesao)) between 2 and 100) not valid,
  add constraint pacientes_localizacao_check check (char_length(btrim(localizacao_quadrante)) between 2 and 150) not valid,
  add constraint pacientes_telefone_check check (whatsapp is not null and whatsapp ~ '^[1-9][0-9]{9,10}$') not valid,
  add constraint pacientes_consentimento_check check (termo_consentimento is true) not valid,
  add constraint pacientes_comorbidades_check check (
    comorbidades is null or (
      cardinality(comorbidades) <= 4
      and comorbidades <@ array['Hipertensão', 'Sobrepeso', 'Nefropatia', 'Dislipidemia']::text[]
      and array_position(comorbidades, null) is null
    )
  ) not valid,
  add constraint pacientes_foto_path_check check (
    foto_path is null or (
      foto_path ~ '^[A-Za-z0-9_-][A-Za-z0-9_./-]*$' and char_length(foto_path) <= 500
      and foto_path !~ '(^|/)\.{1,2}(/|$)'
      and position('//' in foto_path) = 0
      and right(foto_path, 1) <> '/'
    )
  ) not valid,
  add constraint pacientes_consent_version_check check (consent_version is null or char_length(consent_version) between 1 and 50) not valid;

create index pacientes_created_id_idx on public.pacientes (created_at desc, id desc);
create index pacientes_foto_path_idx on public.pacientes (foto_path) where foto_path is not null;

drop policy if exists "Apenas ADM autenticado pode ler" on public.pacientes;
drop policy if exists "Permitir atualizacao apenas para autenticados" on public.pacientes;
drop policy if exists "Permitir delecao apenas para autenticados" on public.pacientes;
drop policy if exists "Permitir insercao publica" on public.pacientes;

alter table public.pacientes enable row level security;
revoke all on public.pacientes from anon, authenticated;
grant select, delete on public.pacientes to authenticated;
grant update (nome, nome_social, whatsapp, sexo, idade, tipo_diabetes, comorbidades, grau_lesao, tempo_lesao, localizacao_quadrante)
  on public.pacientes to authenticated;
grant select, insert, update, delete on public.pacientes to service_role;
revoke all on sequence public.pacientes_id_seq from anon, authenticated;
grant usage, select on sequence public.pacientes_id_seq to service_role;

create policy pacientes_admin_select on public.pacientes for select to authenticated
  using ((select private.is_admin_aal2()));
create policy pacientes_admin_update on public.pacientes for update to authenticated
  using ((select private.is_admin_aal2())) with check ((select private.is_admin_aal2()));
create policy pacientes_admin_delete on public.pacientes for delete to authenticated
  using ((select private.is_admin_aal2()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-lesoes', 'fotos-lesoes', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Apenas ADM visualiza fotos" on storage.objects;
drop policy if exists "Permitir leitura publica em fotos-lesoes" on storage.objects;
drop policy if exists "Permitir upload publico de fotos" on storage.objects;
drop policy if exists "Permitir upload publico em fotos-lesoes" on storage.objects;

-- Keep the platform-managed table grants. With all four legacy policies removed,
-- no anon/authenticated write policy permits browser uploads or file mutations.
create policy fotos_lesoes_admin_linked_select on storage.objects for select to authenticated
  using (
    bucket_id = 'fotos-lesoes'
    and (select private.is_admin_aal2())
    and exists (select 1 from public.pacientes as patient where patient.foto_path = storage.objects.name)
  );

create table private.patient_audit_events (
  id bigint generated always as identity primary key,
  patient_id bigint not null,
  actor_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  occurred_at timestamptz not null default now()
);
create index patient_audit_patient_time_idx on private.patient_audit_events (patient_id, occurred_at desc);
alter table private.patient_audit_events enable row level security;
revoke all on private.patient_audit_events from public, anon, authenticated, service_role;

create table private.storage_cleanup_queue (
  id bigint generated always as identity primary key,
  object_path text not null unique check (
    object_path ~ '^[A-Za-z0-9_-][A-Za-z0-9_./-]*$' and char_length(object_path) <= 500
    and object_path !~ '(^|/)\.{1,2}(/|$)'
    and position('//' in object_path) = 0 and right(object_path, 1) <> '/'
  ),
  patient_id bigint,
  reason text not null check (char_length(reason) between 1 and 64),
  created_at timestamptz not null default now(),
  ready_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0)
);
create index storage_cleanup_ready_idx on private.storage_cleanup_queue (ready_at, id);
alter table private.storage_cleanup_queue enable row level security;
revoke all on private.storage_cleanup_queue from public, anon, authenticated;
grant select, insert, update, delete on private.storage_cleanup_queue to service_role;
grant usage, select on sequence private.storage_cleanup_queue_id_seq to service_role;

create function private.audit_patient_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into private.patient_audit_events (patient_id, actor_id, action)
  values (case when tg_op = 'DELETE' then old.id else new.id end, auth.uid(), tg_op);
  if tg_op = 'DELETE' and old.foto_path is not null then
    insert into private.storage_cleanup_queue (object_path, patient_id, reason, ready_at)
    values (old.foto_path, old.id, 'patient_deleted', now())
    on conflict (object_path) do update
      set patient_id = excluded.patient_id, reason = excluded.reason, ready_at = excluded.ready_at;
  end if;
  return null;
end;
$$;
revoke all on function private.audit_patient_change() from public, anon, authenticated, service_role;
create trigger pacientes_audit_and_queue after insert or update or delete on public.pacientes
  for each row execute function private.audit_patient_change();

create table private.intake_rate_buckets (
  scope text not null check (scope in ('identity', 'global')),
  bucket_key text not null,
  stage text not null check (stage in ('challenge', 'submit')),
  window_start timestamptz not null,
  requests integer not null check (requests > 0),
  primary key (scope, bucket_key, stage, window_start),
  check ((scope = 'identity' and bucket_key ~ '^[a-f0-9]{64}$') or (scope = 'global' and bucket_key = '*'))
);
create index intake_rate_expiry_idx on private.intake_rate_buckets (window_start);
alter table private.intake_rate_buckets enable row level security;
revoke all on private.intake_rate_buckets from public, anon, authenticated;
grant select, insert, update, delete on private.intake_rate_buckets to service_role;

create table private.intake_nonces (
  nonce uuid primary key,
  identity_hash text not null check (identity_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);
create index intake_nonce_expiry_idx on private.intake_nonces (created_at);
alter table private.intake_nonces enable row level security;
revoke all on private.intake_nonces from public, anon, authenticated;
grant select, insert, delete on private.intake_nonces to service_role;

-- Each RPC is invoker-security and service-role-only. A public execute grant is
-- explicitly revoked even if project default privileges grant it automatically.
create function public.intake_budget(p_identity text, p_stage text, p_nonce uuid default null)
returns text language plpgsql security invoker set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_hour timestamptz := date_trunc('hour', v_now at time zone 'UTC') at time zone 'UTC';
  v_global_window timestamptz;
  v_identity_limit integer;
  v_global_limit integer;
  v_count integer;
  v_nonce uuid;
  v_previous_identity text;
  v_reserved_at timestamptz;
begin
  if p_identity is null or p_identity !~ '^[a-f0-9]{64}$' or p_stage not in ('challenge', 'submit') or p_stage is null then
    return 'denied';
  end if;
  delete from private.intake_rate_buckets where window_start < v_now - interval '1 day';
  delete from private.intake_nonces where created_at < v_now - interval '7 days';

  if p_stage = 'submit' then
    if p_nonce is null then return 'denied'; end if;
    -- Serialize reservation/release/insert for the same request. The matching
    -- BEFORE INSERT trigger also takes this lock before checking the reservation.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('tecido-no:intake:' || p_nonce::text, 0));
    select identity_hash, created_at into v_previous_identity, v_reserved_at
      from private.intake_nonces where nonce = p_nonce;
    if found then
      if v_previous_identity <> p_identity then return 'denied'; end if;
      if exists (select 1 from public.pacientes where intake_request_id = p_nonce) then return 'completed'; end if;
      if v_reserved_at > v_now - interval '10 minutes' then return 'pending'; end if;
      -- A dead worker must not leave a form pending for the full receipt-retention
      -- period. Reclaim its expired lease under the same advisory lock and charge
      -- normal retry quotas while preserving the original request UUID.
      delete from private.intake_nonces where nonce = p_nonce and identity_hash = p_identity;
    end if;
    if exists (select 1 from public.pacientes where intake_request_id = p_nonce) then return 'completed'; end if;
    -- The unique nonce serializes simultaneous submissions of the same form.
    insert into private.intake_nonces (nonce, identity_hash) values (p_nonce, p_identity)
      on conflict (nonce) do nothing returning nonce into v_nonce;
    if v_nonce is null then
      select identity_hash into v_previous_identity from private.intake_nonces where nonce = p_nonce;
      if v_previous_identity <> p_identity then return 'denied'; end if;
      if exists (select 1 from public.pacientes where intake_request_id = p_nonce) then return 'completed'; end if;
      return 'pending';
    end if;
    v_identity_limit := 5;
    v_global_limit := 100;
    v_global_window := date_trunc('day', v_now at time zone 'UTC') at time zone 'UTC';
  else
    v_identity_limit := 20;
    v_global_limit := 200;
    v_global_window := v_hour;
  end if;

  insert into private.intake_rate_buckets as bucket (scope, bucket_key, stage, window_start, requests)
  values ('identity', p_identity, p_stage, v_hour, 1)
  on conflict (scope, bucket_key, stage, window_start) do update set requests = bucket.requests + 1
    where bucket.requests < v_identity_limit returning requests into v_count;
  if v_count is null then
    if v_nonce is not null then delete from private.intake_nonces where nonce = v_nonce; end if;
    return 'denied';
  end if;
  v_count := null;
  insert into private.intake_rate_buckets as bucket (scope, bucket_key, stage, window_start, requests)
  values ('global', '*', p_stage, v_global_window, 1)
  on conflict (scope, bucket_key, stage, window_start) do update set requests = bucket.requests + 1
    where bucket.requests < v_global_limit returning requests into v_count;
  if v_count is null then
    if v_nonce is not null then delete from private.intake_nonces where nonce = v_nonce; end if;
    return 'denied';
  end if;
  return 'allowed';
end;
$$;
revoke all on function public.intake_budget(text, text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.intake_budget(text, text, uuid) to service_role;

-- A signed receipt is checked by the Edge Function before this service-only RPC.
-- The supplied identity is the identity in that signature, so a network change
-- does not turn a successful submission into a second patient registration.
create function public.intake_receipt(p_identity text, p_nonce uuid)
returns text language plpgsql stable security invoker set search_path = ''
as $$
declare
  v_previous_identity text;
  v_reserved_at timestamptz;
begin
  if p_identity is null or p_identity !~ '^[a-f0-9]{64}$' or p_nonce is null then
    return 'denied';
  end if;
  select identity_hash, created_at into v_previous_identity, v_reserved_at
    from private.intake_nonces where nonce = p_nonce;
  if not found then return 'unknown'; end if;
  if v_previous_identity <> p_identity then return 'denied'; end if;
  if exists (select 1 from public.pacientes where intake_request_id = p_nonce) then
    return 'completed';
  end if;
  if v_reserved_at <= now() - interval '10 minutes' then return 'unknown'; end if;
  return 'pending';
end;
$$;
revoke all on function public.intake_receipt(text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.intake_receipt(text, uuid) to service_role;

-- Release only a failed reservation, never a request whose insert committed.
-- No quota is refunded: an unsuccessful attempt still consumed server resources.
create function public.release_intake_nonce(p_identity text, p_nonce uuid)
returns boolean language plpgsql security invoker set search_path = ''
as $$
declare
  v_deleted uuid;
begin
  if p_identity is null or p_identity !~ '^[a-f0-9]{64}$' or p_nonce is null then
    return false;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('tecido-no:intake:' || p_nonce::text, 0));
  delete from private.intake_nonces as reservation
  where reservation.nonce = p_nonce and reservation.identity_hash = p_identity
    and not exists (select 1 from public.pacientes where intake_request_id = p_nonce)
  returning reservation.nonce into v_deleted;
  return v_deleted is not null;
end;
$$;
revoke all on function public.release_intake_nonce(text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.release_intake_nonce(text, uuid) to service_role;

-- An insert that was still in flight when a failed HTTP request released its
-- reservation must fail instead of committing without a reconcilable receipt.
-- This function runs as the inserting role; only service_role may insert rows.
create function private.lock_intake_request()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if new.intake_request_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('tecido-no:intake:' || new.intake_request_id::text, 0));
    if not exists (select 1 from private.intake_nonces where nonce = new.intake_request_id) then
      raise exception 'Intake request is not reserved' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.lock_intake_request() from public, anon, authenticated, service_role;
create trigger pacientes_require_intake_reservation before insert on public.pacientes
  for each row execute function private.lock_intake_request();

create function public.queue_photo_cleanup(p_path text, p_patient_id bigint default null, p_reason text default 'failed_upload', p_delay_seconds integer default 0)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  insert into private.storage_cleanup_queue (object_path, patient_id, reason, ready_at)
  values (p_path, p_patient_id, p_reason, now() + make_interval(secs => greatest(0, least(coalesce(p_delay_seconds, 0), 86400))))
  on conflict (object_path) do update set
    patient_id = coalesce(excluded.patient_id, storage_cleanup_queue.patient_id),
    reason = excluded.reason,
    ready_at = excluded.ready_at;
end;
$$;
revoke all on function public.queue_photo_cleanup(text, bigint, text, integer) from public, anon, authenticated, service_role;
grant execute on function public.queue_photo_cleanup(text, bigint, text, integer) to service_role;

create function public.get_photo_cleanup(p_patient_id bigint default null, p_limit integer default 20)
returns table (id bigint, object_path text) language plpgsql security invoker set search_path = ''
as $$
begin
  -- Once an upload is attached, its pre-upload safety entry is no longer needed.
  -- A future patient deletion creates a new entry in the trigger above.
  delete from private.storage_cleanup_queue as queued
    where exists (select 1 from public.pacientes as patient where patient.foto_path = queued.object_path);
  return query
    with candidates as (
      select queued.id from private.storage_cleanup_queue as queued
      where queued.ready_at <= now()
        and (p_patient_id is null or queued.patient_id = p_patient_id)
        and not exists (select 1 from public.pacientes as patient where patient.foto_path = queued.object_path)
      order by queued.ready_at, queued.id
      limit greatest(1, least(coalesce(p_limit, 20), 100))
      for update skip locked
    ), claimed as (
      update private.storage_cleanup_queue as queued
      set ready_at = now() + interval '5 minutes', attempts = queued.attempts + 1
      from candidates where queued.id = candidates.id
      returning queued.id, queued.object_path
    )
    select claimed.id, claimed.object_path from claimed;
end;
$$;
revoke all on function public.get_photo_cleanup(bigint, integer) from public, anon, authenticated, service_role;
grant execute on function public.get_photo_cleanup(bigint, integer) to service_role;

create function public.finish_photo_cleanup(p_id bigint, p_success boolean)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  if p_success is true then
    delete from private.storage_cleanup_queue where id = p_id;
  else
    update private.storage_cleanup_queue set ready_at = now() + interval '15 minutes' where id = p_id;
  end if;
end;
$$;
revoke all on function public.finish_photo_cleanup(bigint, boolean) from public, anon, authenticated, service_role;
grant execute on function public.finish_photo_cleanup(bigint, boolean) to service_role;

comment on column public.pacientes.foto_path is 'Private fotos-lesoes bucket object path; resolve with a short-lived signed URL after AAL2 authorization.';
comment on column public.pacientes.consent_accepted_at is 'Server-recorded acceptance time for new intake. Null for historical records without this evidence.';
comment on table private.patient_audit_events is 'Administrative audit metadata only: no names, phone numbers, images, or clinical payloads.';
comment on table private.intake_nonces is 'Idempotency reservation with a ten-minute pending lease, retained up to seven days for completed receipts; stores only random nonce, keyed identity hash and reservation time.';
