import supabase from './db-client.js';
import { cors, body, fail } from './_helpers.js';
const allowed = ['title','amount','type','date','txn_date','category','note','account_id'];
const pick = (x) => Object.fromEntries(allowed.filter((k) => x[k] !== undefined).map((k) => [k, x[k]]));
export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') { const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false }); if (error) throw error; return res.json(data || []); }
    const x = body(req);
    if (req.method === 'POST') { if (!x.amount || !x.type) return res.status(400).json({ error: 'amount and type are required' }); const { data, error } = await supabase.from('transactions').insert(pick({ ...x, date: x.date || x.txn_date || new Date().toISOString().slice(0, 10) })).select().single(); if (error) throw error; return res.status(201).json(data); }
    if (req.method === 'PUT') { if (!x.id) return res.status(400).json({ error: 'id is required' }); const { data, error } = await supabase.from('transactions').update(pick(x)).eq('id', x.id).select().single(); if (error) throw error; return res.json(data); }
    if (req.method === 'DELETE') { const { error } = await supabase.from('transactions').delete().eq('id', x.id || req.query?.id); if (error) throw error; return res.json({ ok: true }); }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) { return fail(res, error); }
}
