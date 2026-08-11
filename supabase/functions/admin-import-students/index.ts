import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RowIn {
  full_name?: string;
  admission_no?: string;
  class_name?: string;
  email?: string;
}

interface ResultRow {
  admission_no: string;
  full_name: string;
  email: string;
  password: string;
  status: 'created' | 'failed';
  error?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const makePassword = (fullName: string, admissionNo: string) => {
  const first = (fullName.trim().split(/\s+/)[0] ?? 'student').replace(/[^A-Za-z0-9]/g, '');
  let pwd = `${first}@${admissionNo.replace(/\s+/g, '')}`;
  if (pwd.length < 8) pwd = `${pwd}#school`;
  return pwd;
};

const makeEmail = (admissionNo: string) =>
  `${admissionNo.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@student.school`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Invalid session' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json({ error: 'Forbidden: admin only' }, 403);

    const body = (await req.json()) as { students?: RowIn[] };
    const input = Array.isArray(body.students) ? body.students : [];
    if (input.length === 0) return json({ error: 'No student rows provided' }, 400);
    if (input.length > 500) return json({ error: 'Maximum 500 students per import' }, 400);

    const { data: classRows } = await admin.from('classes').select('name');
    const validClasses = new Set((classRows ?? []).map((c: { name: string }) => c.name));

    const results: ResultRow[] = [];

    for (const raw of input) {
      const full_name = (raw.full_name ?? '').trim();
      const admission_no = (raw.admission_no ?? '').trim();
      const class_name = (raw.class_name ?? '').trim();
      const email = (raw.email ?? '').trim().toLowerCase() || makeEmail(admission_no || 'x');
      const password = makePassword(full_name || 'student', admission_no || 'student');

      const base: ResultRow = { admission_no, full_name, email, password, status: 'failed' };

      if (!full_name || !admission_no || !class_name) {
        results.push({ ...base, error: 'full_name, admission_no and class_name are required' });
        continue;
      }
      if (!validClasses.has(class_name)) {
        results.push({ ...base, error: `Class "${class_name}" does not exist. Create it first.` });
        continue;
      }

      const { data: existing } = await admin
        .from('students')
        .select('id')
        .eq('admission_no', admission_no)
        .maybeSingle();
      if (existing) {
        results.push({ ...base, error: 'Admission number already exists' });
        continue;
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (createErr || !created.user) {
        results.push({ ...base, error: createErr?.message ?? 'Account creation failed' });
        continue;
      }
      const uid = created.user.id;

      await admin.from('profiles').update({ full_name, email }).eq('id', uid);
      const { error: roleErr } = await admin.from('user_roles').insert({ user_id: uid, role: 'student' });
      if (roleErr) {
        await admin.auth.admin.deleteUser(uid);
        results.push({ ...base, error: 'Role assignment failed: ' + roleErr.message });
        continue;
      }

      const { error: stuErr } = await admin
        .from('students')
        .insert({ user_id: uid, admission_no, class_name, full_name });
      if (stuErr) {
        await admin.auth.admin.deleteUser(uid);
        results.push({ ...base, error: 'Student record failed: ' + stuErr.message });
        continue;
      }

      results.push({ ...base, status: 'created' });
    }

    const createdCount = results.filter((r) => r.status === 'created').length;
    return json({ success: true, created: createdCount, failed: results.length - createdCount, results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
