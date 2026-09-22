import supabase from './db-client.js';
import { cors, body, fail } from './_helpers.js';
export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') { const { data, error } = await supabase.from('settings').select('*').limit(1); if (error) throw error; return res.json(data?.[0] || {}); }
    if (req.method === 'PUT' || req.method === 'POST') { const x = body(req); const { data: current } = await supabase.from('settings').select('id').limit(1); const result = current?.[0]?.id ? await supabase.from('settings').update(x).eq('id', current[0].id).select().single() : await supabase.from('settings').insert(x).select().single(); if (result.error) throw result.error; return res.json(result.data); }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) { return fail(res, error); }
}
