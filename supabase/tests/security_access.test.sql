-- Run only against the local/isolated Supabase stack: supabase test db.
-- Fixtures are synthetic. All user, patient, storage metadata and budget changes
-- are rolled back; no Storage HTTP API or binary object is accessed.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select ok((select relrowsecurity from pg_class where oid = 'public.pacientes'::regclass), 'patients have RLS enabled');
select is(has_table_privilege('anon', 'public.pacientes', 'INSERT'), false, 'anon cannot insert patients directly');
select is(has_table_privilege('authenticated', 'public.pacientes', 'INSERT'), false, 'authenticated cannot insert patients directly');
select is(has_table_privilege('anon', 'public.pacientes', 'SELECT'), false, 'anon has no patient read grant');
select is(has_column_privilege('authenticated', 'public.pacientes', 'nome', 'UPDATE'), true, 'authorized update grant is limited to editable columns');
select is(has_column_privilege('authenticated', 'public.pacientes', 'foto_path', 'UPDATE'), false, 'browser cannot change the photo binding');
select is(has_column_privilege('authenticated', 'public.pacientes', 'termo_consentimento', 'UPDATE'), false, 'browser cannot rewrite historical consent');
select is(has_table_privilege('authenticated', 'private.admin_users', 'SELECT'), false, 'browser cannot read the administrator table');
select is(has_table_privilege('authenticated', 'private.patient_audit_events', 'INSERT'), false, 'browser cannot forge audit events');
select is(has_function_privilege('anon', 'public.admin_access()', 'EXECUTE'), false, 'anon cannot call membership RPC');
select is(has_function_privilege('authenticated', 'public.admin_access()', 'EXECUTE'), true, 'authenticated can check membership at AAL1');
select is(has_function_privilege('authenticated', 'public.intake_budget(text,text,uuid)', 'EXECUTE'), false, 'browser cannot consume or bypass the intake budget RPC');
select is(has_function_privilege('anon', 'public.intake_receipt(text,uuid)', 'EXECUTE'), false, 'anonymous callers cannot inspect receipt state directly');
select is(has_function_privilege('authenticated', 'public.intake_receipt(text,uuid)', 'EXECUTE'), false, 'authenticated callers cannot inspect receipt state directly');
select is(has_function_privilege('anon', 'public.release_intake_nonce(text,uuid)', 'EXECUTE'), false, 'anonymous callers cannot release a pending request');
select is(has_function_privilege('authenticated', 'public.release_intake_nonce(text,uuid)', 'EXECUTE'), false, 'authenticated callers cannot release a pending request');
select is(has_function_privilege('anon', 'public.queue_photo_cleanup(text,bigint,text,integer)', 'EXECUTE'), false, 'anon cannot schedule deletion of a file');
select is(has_function_privilege('authenticated', 'public.get_photo_cleanup(bigint,integer)', 'EXECUTE'), false, 'browser cannot read cleanup paths');
select is(has_function_privilege('authenticated', 'public.finish_photo_cleanup(bigint,boolean)', 'EXECUTE'), false, 'browser cannot acknowledge cleanup work');
select is(has_function_privilege('service_role', 'public.intake_budget(text,text,uuid)', 'EXECUTE'), true, 'server can use the budget RPC');
select is(has_function_privilege('service_role', 'public.intake_receipt(text,uuid)', 'EXECUTE'), true, 'server can inspect a verified receipt');
select is(has_function_privilege('service_role', 'public.release_intake_nonce(text,uuid)', 'EXECUTE'), true, 'server can release a failed reservation');
select ok((select bool_and(not p.prosecdef) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('admin_access', 'intake_budget', 'intake_receipt', 'release_intake_nonce', 'queue_photo_cleanup', 'get_photo_cleanup', 'finish_photo_cleanup')), 'all public application RPCs use invoker security');
select is((select public from storage.buckets where id = 'fotos-lesoes'), false, 'clinical bucket is private');
select is((select file_size_limit from storage.buckets where id = 'fotos-lesoes'), 3145728::bigint, 'bucket rejects files over 3 MiB');
select ok((select allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp'] and cardinality(allowed_mime_types) = 3 from storage.buckets where id = 'fotos-lesoes'), 'bucket only permits the three configured image types');
select is((select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname in ('Apenas ADM visualiza fotos', 'Permitir leitura publica em fotos-lesoes', 'Permitir upload publico de fotos', 'Permitir upload publico em fotos-lesoes')), 0::bigint, 'all four legacy storage policies are removed');
select ok((select bool_and(not convalidated) from pg_constraint where conrelid = 'public.pacientes'::regclass and conname in ('pacientes_idade_check', 'pacientes_telefone_check', 'pacientes_consentimento_check')), 'historical checks remain NOT VALID until historical data is reviewed');
select columns_are('private', 'patient_audit_events', array['id', 'patient_id', 'actor_id', 'action', 'occurred_at'], 'audit stores no clinical payload');

insert into auth.users (id, email, aud, role) values
  ('11111111-1111-4111-8111-111111111111', 'admin-synthetic@example.invalid', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'regular-synthetic@example.invalid', 'authenticated', 'authenticated');
insert into private.admin_users (user_id) values ('11111111-1111-4111-8111-111111111111');
insert into public.pacientes (id, nome, sexo, idade, tipo_diabetes, comorbidades, grau_lesao, tempo_lesao, localizacao_quadrante, whatsapp, termo_consentimento, foto_path)
values (-91001, 'Paciente Sintético', 'F', 52, 'Tipo 2', array['Hipertensão'], 'Grau 1', '2 semanas', 'Pé esquerdo', '85999999999', true, 'security-test-linked.jpg');
insert into storage.objects (bucket_id, name) values
  ('fotos-lesoes', 'security-test-linked.jpg'),
  ('fotos-lesoes', 'security-test-orphan.jpg');

select throws_ok($$insert into public.pacientes (nome, sexo, idade, tipo_diabetes, grau_lesao, tempo_lesao, localizacao_quadrante, whatsapp, termo_consentimento) values ('Teste Inválido', 'M', 0, 'Tipo 1', 'Grau 1', '2 dias', 'Pé direito', '85999999999', true)$$, '23514', null, 'new rows cannot contain invalid age');
select throws_ok($$insert into public.pacientes (nome, sexo, idade, tipo_diabetes, grau_lesao, tempo_lesao, localizacao_quadrante, whatsapp, termo_consentimento) values ('Teste Inválido', 'M', 40, 'Tipo 1', 'Grau 1', '2 dias', 'Pé direito', '85', true)$$, '23514', null, 'new rows cannot contain invalid phone');
select throws_ok($$insert into public.pacientes (nome, sexo, idade, tipo_diabetes, grau_lesao, tempo_lesao, localizacao_quadrante, whatsapp, termo_consentimento) values ('Teste Inválido', 'M', 40, 'Tipo 1', 'Grau 1', '2 dias', 'Pé direito', '85999999999', false)$$, '23514', null, 'new rows cannot bypass the required consent');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok('select id from public.pacientes', '42501', null, 'anonymous patient read is denied at the grant');
select throws_ok('select public.admin_access()', '42501', null, 'anonymous membership check is denied');
select throws_ok($$select public.intake_receipt(repeat('a', 64), '55555555-5555-4555-8555-555555555551')$$, '42501', null, 'anonymous receipt RPC call is denied');
select throws_ok($$select public.release_intake_nonce(repeat('a', 64), '55555555-5555-4555-8555-555555555551')$$, '42501', null, 'anonymous release RPC call is denied');
select is((select count(*) from storage.objects where bucket_id = 'fotos-lesoes' and name like 'security-test-%'), 0::bigint, 'anonymous cannot list clinical objects');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('fotos-lesoes', 'security-test-forbidden.jpg')$$, '42501', null, 'anonymous storage upload metadata is denied by RLS');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal2"}';
select is(public.admin_access(), false, 'regular account is not an administrator even at AAL2');
select is((select count(*) from public.pacientes where id = -91001), 0::bigint, 'regular account cannot read patient rows');
with changed as (update public.pacientes set nome = 'Alteração Indevida' where id = -91001 returning id)
select is((select count(*) from changed), 0::bigint, 'regular account cannot update patient rows');
with removed as (delete from public.pacientes where id = -91001 returning id)
select is((select count(*) from removed), 0::bigint, 'regular account cannot delete patient rows');
select is((select count(*) from storage.objects where bucket_id = 'fotos-lesoes' and name like 'security-test-%'), 0::bigint, 'regular account cannot read patient photos');
select throws_ok('select * from private.admin_users', '42501', null, 'regular account cannot query private admin membership');
select throws_ok($$select public.intake_budget(repeat('a', 64), 'challenge')$$, '42501', null, 'regular account cannot call server-only budget');
select throws_ok($$select public.intake_receipt(repeat('a', 64), '55555555-5555-4555-8555-555555555551')$$, '42501', null, 'regular account cannot call receipt RPC');
select throws_ok($$select public.release_intake_nonce(repeat('a', 64), '55555555-5555-4555-8555-555555555551')$$, '42501', null, 'regular account cannot call release RPC');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}';
select is(public.admin_access(), true, 'authorized administrator can start MFA while at AAL1');
select is((select count(*) from public.pacientes where id = -91001), 0::bigint, 'administrator AAL1 cannot read patient rows');
with changed as (update public.pacientes set nome = 'Alteração AAL1' where id = -91001 returning id)
select is((select count(*) from changed), 0::bigint, 'administrator AAL1 cannot update patient rows');
select is((select count(*) from storage.objects where bucket_id = 'fotos-lesoes' and name like 'security-test-%'), 0::bigint, 'administrator AAL1 cannot read photos');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}';
select is(public.admin_access(), true, 'administrator remains authorized at AAL2');
select is((select count(*) from public.pacientes where id = -91001), 1::bigint, 'administrator AAL2 can read authorized patients');
select is((select count(*) from storage.objects where bucket_id = 'fotos-lesoes' and name = 'security-test-linked.jpg'), 1::bigint, 'administrator AAL2 can access a photo linked to a patient');
select is((select count(*) from storage.objects where bucket_id = 'fotos-lesoes' and name = 'security-test-orphan.jpg'), 0::bigint, 'even administrator AAL2 cannot access an orphan photo');
with changed as (update public.pacientes set nome = 'Paciente Atualizado' where id = -91001 returning id)
select is((select count(*) from changed), 1::bigint, 'administrator AAL2 can update allowed columns');
select throws_ok($$update public.pacientes set foto_path = 'other.jpg' where id = -91001$$, '42501', null, 'administrator cannot swap a patient photo binding directly');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('fotos-lesoes', 'security-test-forbidden-admin.jpg')$$, '42501', null, 'administrator cannot bypass server-controlled upload');
select throws_ok('select * from private.patient_audit_events', '42501', null, 'administrator browser cannot read the private audit table');
reset role;
select is((select count(*) from private.patient_audit_events where patient_id = -91001 and action = 'UPDATE' and actor_id = '11111111-1111-4111-8111-111111111111'), 1::bigint, 'database update trigger records the actual administrator actor');

-- No production identities or raw IP addresses are used in budget tests.
delete from private.intake_rate_buckets;
delete from private.intake_nonces;
insert into private.intake_nonces (nonce, identity_hash, created_at) values
  ('66666666-6666-4666-8666-666666666661', repeat('b',64), now() - interval '11 minutes'),
  ('66666666-6666-4666-8666-666666666662', repeat('b',64), now() - interval '10 minutes'),
  ('66666666-6666-4666-8666-666666666663', repeat('b',64), now() - interval '9 minutes');
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select is(public.intake_budget('raw-ip-is-not-accepted', 'challenge'), 'denied', 'budget refuses raw IP identity input');
select is(public.intake_budget(repeat('a', 64), 'unexpected'), 'denied', 'budget refuses unknown stages');
select is(public.intake_budget(repeat('a', 64), 'submit'), 'denied', 'submission requires a nonce');
select is(public.intake_receipt('raw-ip-is-not-accepted', '55555555-5555-4555-8555-555555555551'), 'denied', 'receipt rejects invalid identity input');
select is(public.intake_receipt(null, '55555555-5555-4555-8555-555555555551'), 'denied', 'receipt rejects a missing identity');
select is(public.intake_receipt(repeat('a',64), null), 'denied', 'receipt rejects a missing nonce');
select is(public.intake_receipt(repeat('a',64), '55555555-5555-4555-8555-555555555551'), 'unknown', 'receipt reports an unknown request without creating a reservation');
select is(public.release_intake_nonce('raw-ip-is-not-accepted', '55555555-5555-4555-8555-555555555551'), false, 'release rejects invalid identity input');
select is(public.release_intake_nonce(null, '55555555-5555-4555-8555-555555555551'), false, 'release rejects a missing identity');
select is(public.release_intake_nonce(repeat('a',64), null), false, 'release rejects a missing nonce');
select is(public.release_intake_nonce(repeat('a',64), '55555555-5555-4555-8555-555555555551'), false, 'release of an unknown nonce is harmless');
select is(public.intake_budget(repeat('a',64), 'submit', '55555555-5555-4555-8555-555555555551'), 'allowed', 'failed attempt can first reserve a nonce');
select is(public.intake_receipt(repeat('a',64), '55555555-5555-4555-8555-555555555551'), 'pending', 'receipt distinguishes a reserved in-flight request');
select is(public.intake_receipt(repeat('b',64), '55555555-5555-4555-8555-555555555551'), 'denied', 'receipt refuses a nonce owned by a different identity');
select is(public.release_intake_nonce(repeat('b',64), '55555555-5555-4555-8555-555555555551'), false, 'wrong identity cannot release the reservation');
select is(public.intake_receipt(repeat('a',64), '55555555-5555-4555-8555-555555555551'), 'pending', 'wrong-identity release leaves the reservation intact');
select is(public.release_intake_nonce(repeat('a',64), '55555555-5555-4555-8555-555555555551'), true, 'matching failed request can release its reservation');
select is(public.intake_receipt(repeat('a',64), '55555555-5555-4555-8555-555555555551'), 'unknown', 'released reservation becomes unknown until an explicit retry');
select is((select requests from private.intake_rate_buckets where scope = 'identity' and bucket_key = repeat('a',64) and stage = 'submit'), 1, 'receipt and release do not refund or spend submission quota');
select throws_ok($$insert into public.pacientes (nome, sexo, idade, tipo_diabetes, grau_lesao, tempo_lesao, localizacao_quadrante, whatsapp, termo_consentimento, intake_request_id) values ('Envio Sintético Liberado', 'M', 40, 'Tipo 1', 'Grau 1', '2 dias', 'Pé direito', '85999999999', true, '55555555-5555-4555-8555-555555555551')$$, '23514', 'Intake request is not reserved', 'insert arriving after release cannot commit without a receipt reservation');
select is(public.intake_budget(repeat('a',64), 'submit', '55555555-5555-4555-8555-555555555551'), 'allowed', 'explicit retry may reuse the released stable request ID');
select is(public.intake_receipt(repeat('a',64), '55555555-5555-4555-8555-555555555551'), 'pending', 'retry has one shared pending reservation');
select is(public.intake_receipt(repeat('b',64), '66666666-6666-4666-8666-666666666663'), 'pending', 'a lease younger than ten minutes remains pending');
select is(public.intake_budget(repeat('b',64), 'submit', '66666666-6666-4666-8666-666666666663'), 'pending', 'a live worker lease cannot be claimed by a retry');
select is(public.intake_receipt(repeat('b',64), '66666666-6666-4666-8666-666666666661'), 'unknown', 'a dead worker lease becomes unknown after ten minutes');
select is(public.intake_receipt(repeat('b',64), '66666666-6666-4666-8666-666666666662'), 'unknown', 'the ten-minute lease boundary is expired');
select is(public.intake_budget(repeat('c',64), 'submit', '66666666-6666-4666-8666-666666666661'), 'denied', 'an expired lease cannot be reassigned to a different identity');
select is(public.intake_budget(repeat('b',64), 'submit', '66666666-6666-4666-8666-666666666661'), 'allowed', 'matching retry reclaims an expired lease using the same request UUID');
select ok((select created_at >= now() from private.intake_nonces where nonce = '66666666-6666-4666-8666-666666666661' and identity_hash = repeat('b',64)), 'reclaimed lease has a new reservation timestamp');
select is(public.intake_receipt(repeat('b',64), '66666666-6666-4666-8666-666666666661'), 'pending', 'receipt observes the renewed lease under the original UUID');
select is(public.intake_budget(repeat('b',64), 'submit', '66666666-6666-4666-8666-666666666661'), 'pending', 'another retry cannot immediately reclaim the renewed lease');
select is((select requests from private.intake_rate_buckets where scope = 'identity' and bucket_key = repeat('b',64) and stage = 'submit'), 1, 'reclaiming a dead worker consumes normal retry quota once');
select is(public.intake_budget(repeat('a', 64), 'challenge'), 'allowed', 'first challenge consumes one budget unit');
do $$ begin for counter in 1..19 loop perform public.intake_budget(repeat('a', 64), 'challenge'); end loop; end $$;
select is(public.intake_budget(repeat('a', 64), 'challenge'), 'denied', '21st challenge for an identity in the hour is denied');
select is((select requests from private.intake_rate_buckets where scope = 'identity' and bucket_key = repeat('a',64) and stage = 'challenge'), 20, 'denied attempts do not exceed the atomic identity counter');
update private.intake_rate_buckets set requests = 199 where scope = 'global' and stage = 'challenge';
select is(public.intake_budget(repeat('b', 64), 'challenge'), 'allowed', '200th global challenge is allowed');
select is(public.intake_budget(repeat('c', 64), 'challenge'), 'denied', '201st global challenge is denied');

select is(public.intake_budget(repeat('d', 64), 'submit', '33333333-3333-4333-8333-333333333331'), 'allowed', 'first submission reserves its nonce');
select is(public.intake_budget(repeat('d', 64), 'submit', '33333333-3333-4333-8333-333333333331'), 'pending', 'same in-progress nonce cannot be consumed twice');
select is(public.intake_budget(repeat('e', 64), 'submit', '33333333-3333-4333-8333-333333333331'), 'denied', 'nonce cannot move to another identity hash');
insert into public.pacientes (id, nome, sexo, idade, tipo_diabetes, grau_lesao, tempo_lesao, localizacao_quadrante, whatsapp, termo_consentimento, intake_request_id, consent_version, consent_accepted_at)
values (-91002, 'Cadastro Sintético Idempotente', 'M', 41, 'Tipo 1', 'Grau 1', '2 dias', 'Pé direito', '85999999998', true, '33333333-3333-4333-8333-333333333331', 'synthetic-test', now());
select is(public.intake_budget(repeat('d', 64), 'submit', '33333333-3333-4333-8333-333333333331'), 'completed', 'successful nonce replay is idempotently completed');
select is(public.intake_receipt(repeat('d',64), '33333333-3333-4333-8333-333333333331'), 'completed', 'receipt reconciles a committed insert after a lost HTTP response');
select is(public.intake_receipt(repeat('e',64), '33333333-3333-4333-8333-333333333331'), 'denied', 'completed receipt remains bound to the signed identity');
select is(public.release_intake_nonce(repeat('d',64), '33333333-3333-4333-8333-333333333331'), false, 'release never removes a reservation whose patient insert committed');
select is(public.intake_receipt(repeat('d',64), '33333333-3333-4333-8333-333333333331'), 'completed', 'completed receipt remains reconcilable after a release attempt');
reset role;
update private.intake_nonces set created_at = now() - interval '1 hour' where nonce = '33333333-3333-4333-8333-333333333331';
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select is(public.intake_receipt(repeat('d',64), '33333333-3333-4333-8333-333333333331'), 'completed', 'a completed receipt is preserved even after its pending lease would expire');
select is(public.intake_budget(repeat('d',64), 'submit', '33333333-3333-4333-8333-333333333331'), 'completed', 'retry never reclaims an old nonce whose patient already exists');
select is(public.release_intake_nonce(repeat('d',64), '33333333-3333-4333-8333-333333333331'), false, 'an old completed reservation cannot be released');
select is((select count(*) from private.intake_nonces where nonce = '33333333-3333-4333-8333-333333333331' and created_at = now() - interval '1 hour'), 1::bigint, 'completed reservation timestamp and identity remain untouched');
select throws_ok($$insert into public.pacientes (nome, sexo, idade, tipo_diabetes, grau_lesao, tempo_lesao, localizacao_quadrante, whatsapp, termo_consentimento, intake_request_id) values ('Worker Sintético Tardio', 'M', 40, 'Tipo 1', 'Grau 1', '2 dias', 'Pé direito', '85999999999', true, '33333333-3333-4333-8333-333333333331')$$, '23505', null, 'unique request UUID prevents a late worker from duplicating a completed patient');
select is((select requests from private.intake_rate_buckets where scope = 'identity' and bucket_key = repeat('d', 64) and stage = 'submit'), 1, 'duplicate nonce does not consume additional budget');
do $$ begin for counter in 2..5 loop perform public.intake_budget(repeat('d', 64), 'submit', ('33333333-3333-4333-8333-' || lpad(counter::text,12,'0'))::uuid); end loop; end $$;
select is(public.intake_budget(repeat('d', 64), 'submit', '33333333-3333-4333-8333-333333333339'), 'denied', 'sixth hourly submission for an identity is denied');
select is((select count(*) from private.intake_nonces where nonce = '33333333-3333-4333-8333-333333333339'), 0::bigint, 'denied rate-limit request leaves no pending nonce');
update private.intake_rate_buckets set requests = 99 where scope = 'global' and stage = 'submit';
select is(public.intake_budget(repeat('f', 64), 'submit', '44444444-4444-4444-8444-444444444441'), 'allowed', '100th daily global submission is allowed');
select is(public.intake_budget(repeat('e', 64), 'submit', '44444444-4444-4444-8444-444444444442'), 'denied', '101st daily global submission is denied');

select lives_ok($$select public.queue_photo_cleanup('security-test-linked.jpg', -91001, 'upload_pending')$$, 'server can enqueue a pre-upload cleanup safety record');
select is((select count(*) from public.get_photo_cleanup(-91001, 20)), 0::bigint, 'cleanup refuses a file linked to an active patient');
select lives_ok($$select public.queue_photo_cleanup('security-test-cleanup.jpg', -91003, 'failed_upload')$$, 'server can enqueue an unattached upload');
select is((select count(*) from public.get_photo_cleanup(-91003, 20)), 1::bigint, 'cleanup claims an eligible orphan');
select is((select count(*) from public.get_photo_cleanup(-91003, 20)), 0::bigint, 'claimed file is leased and not returned to a parallel worker');
select lives_ok($$select public.finish_photo_cleanup((select id from private.storage_cleanup_queue where object_path = 'security-test-cleanup.jpg'), false)$$, 'failed cleanup can be acknowledged without losing its queue entry');
select ok((select ready_at >= now() + interval '14 minutes' from private.storage_cleanup_queue where object_path = 'security-test-cleanup.jpg'), 'failed cleanup backs off for fifteen minutes');
select lives_ok($$select public.finish_photo_cleanup((select id from private.storage_cleanup_queue where object_path = 'security-test-cleanup.jpg'), true)$$, 'successful cleanup can be acknowledged');
select is((select count(*) from private.storage_cleanup_queue where object_path = 'security-test-cleanup.jpg'), 0::bigint, 'successful cleanup removes its queue entry');
select throws_ok($$select public.queue_photo_cleanup('../escape.jpg')$$, '23514', null, 'cleanup queue rejects traversal paths');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}';
with removed as (delete from public.pacientes where id = -91001 returning id)
select is((select count(*) from removed), 1::bigint, 'administrator AAL2 can delete a patient');
reset role;
select is((select count(*) from private.patient_audit_events where patient_id = -91001 and action = 'DELETE' and actor_id = '11111111-1111-4111-8111-111111111111'), 1::bigint, 'delete is audited with the administrator actor');
select is((select count(*) from private.storage_cleanup_queue where patient_id = -91001 and object_path = 'security-test-linked.jpg' and ready_at <= now()), 1::bigint, 'delete durably schedules removal of the associated photo');

select * from finish();
rollback;
