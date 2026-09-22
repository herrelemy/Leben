import supabase from './db-client.js';
import { cors, body, fail, asNumber } from './_helpers.js';

const fields = ['name','course','days','time','duration_min','location','color','notes','status'];
const clean = (input) => Object.fromEntries(fields.filter((key) => input[key] !== undefined).map((key) => [key, key === 'days' ? (Array.isArray(input[key]) ? input[key].map(Number) : []) : input[key]]));

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('groups').select('*').order('name', { ascending: true });
      if (error) throw error;
      const students = await supabase.from('students').select('id,group_name');
      const counts = {};
      (students.data || []).forEach((s) => { counts[s.group_name] = (counts[s.group_name] || 0) + 1; });
      return res.status(200).json((data || []).map((g) => ({ ...g, days: Array.isArray(g.days) ? g.days : [], duration_min: asNumber(g.duration_min, 90), students_count: counts[g.name] || 0 })));
    }
    const input = body(req);
    if (req.method === 'POST') {
      if (!String(input.name || '').trim() || !Array.isArray(input.days) || !input.days.length || !input.time) return res.status(400).json({ error: 'name, days and time are required' });
      const { data, error } = await supabase.from('groups').insert({ ...clean({ ...input, name: String(input.name).trim(), status: input.status || 'active' }) }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      if (!input.id) return res.status(400).json({ error: 'id is required' });
      const { data, error } = await supabase.from('groups').update(clean(input)).eq('id', input.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const id = input.id || req.query?.id;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('groups').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) { return fail(res, error); }
}
