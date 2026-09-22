import supabase from './db-client.js';
import { cors, body, fail } from './_helpers.js';
const allowed = ['name','grade','phone','parent_contact','course','fee','paid','status','notes','group_name','group_id','avatar_color'];
const pick = (x) => Object.fromEntries(allowed.filter((k) => x[k] !== undefined).map((k) => [k, x[k]]));
export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') { const { data, error } = await supabase.from('students').select('*').order('name'); if (error) throw error; return res.json(data || []); }
    const x = body(req);
    if (req.method === 'POST') { if (!String(x.name || '').trim()) return res.status(400).json({ error: 'name is required' }); const { data, error } = await supabase.from('students').insert(pick({ ...x, name: String(x.name).trim() })).select().single(); if (error) throw error; return res.status(201).json(data); }
    if (req.method === 'PUT') { if (!x.id) return res.status(400).json({ error: 'id is required' }); const { data, error } = await supabase.from('students').update(pick(x)).eq('id', x.id).select().single(); if (error) throw error; return res.json(data); }
    if (req.method === 'DELETE') { const id = x.id || req.query?.id; const { error } = await supabase.from('students').delete().eq('id', id); if (error) throw error; return res.json({ ok: true }); }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) { return fail(res, error); }
}
