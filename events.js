import supabase from './db-client.js';
import { cors, body, fail } from './_helpers.js';
const allowed = ['title','date','event_date','time','event_time','location','notes','type','status'];
const pick = (x) => Object.fromEntries(allowed.filter((k) => x[k] !== undefined).map((k) => [k, x[k]]));
export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') { const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true }); if (error) throw error; return res.json(data || []); }
    const x = body(req);
    if (req.method === 'POST') { if (!x.title) return res.status(400).json({ error: 'title is required' }); const { data, error } = await supabase.from('events').insert(pick({ ...x, date: x.date || x.event_date, time: x.time || x.event_time })).select().single(); if (error) throw error; return res.status(201).json(data); }
    if (req.method === 'PUT') { if (!x.id) return res.status(400).json({ error: 'id is required' }); const { data, error } = await supabase.from('events').update(pick(x)).eq('id', x.id).select().single(); if (error) throw error; return res.json(data); }
    if (req.method === 'DELETE') { const { error } = await supabase.from('events').delete().eq('id', x.id || req.query?.id); if (error) throw error; return res.json({ ok: true }); }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) { return fail(res, error); }
}
