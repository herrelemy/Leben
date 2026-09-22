import supabase from './db-client.js';
import { cors, body, fail } from './_helpers.js';
const allowed = ['title','project','deadline','due_date','time','priority','status','notes','description','world'];
const pick = (x) => Object.fromEntries(allowed.filter((k) => x[k] !== undefined).map((k) => [k, x[k]]));
export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') { let q = supabase.from('tasks').select('*').order('deadline', { ascending: true }); if (req.query?.limit) q = q.limit(Number(req.query.limit)); const { data, error } = await q; if (error) throw error; return res.json(data || []); }
    const x = body(req);
    if (req.method === 'POST') { if (!String(x.title || '').trim()) return res.status(400).json({ error: 'title is required' }); const { data, error } = await supabase.from('tasks').insert(pick({ ...x, title: String(x.title).trim(), status: x.status || 'new' })).select().single(); if (error) throw error; return res.status(201).json(data); }
    if (req.method === 'PUT') { if (!x.id) return res.status(400).json({ error: 'id is required' }); const { data, error } = await supabase.from('tasks').update(pick(x)).eq('id', x.id).select().single(); if (error) throw error; return res.json(data); }
    if (req.method === 'DELETE') { const id = x.id || req.query?.id; const { error } = await supabase.from('tasks').delete().eq('id', id); if (error) throw error; return res.json({ ok: true }); }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) { return fail(res, error); }
}
