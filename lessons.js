import supabase from './db-client.js';
import { cors, body, fail, today, datePlus } from './_helpers.js';

const normalize = (x) => ({ title: x.title || 'حصة', group_name: x.group_name || null, date: x.date || x.lesson_date || null, time: x.time || x.lesson_time || null, duration: x.duration || x.duration_min || 90, topic: x.topic || null, notes: x.notes || null, status: x.status || 'planned' });
export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') {
      let q = supabase.from('lessons').select('*').order('date', { ascending: true }).order('time', { ascending: true });
      if (req.query?.upcoming) q = q.gte('date', today());
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json((data || []).map((x) => ({ ...x, lesson_date: x.lesson_date || x.date, lesson_time: x.lesson_time || x.time })));
    }
    const input = body(req);
    if (req.method === 'POST') {
      const item = normalize(input);
      if (!item.date) item.date = today();
      const { data, error } = await supabase.from('lessons').insert(item).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      if (!input.id) return res.status(400).json({ error: 'id is required' });
      const { data, error } = await supabase.from('lessons').update(normalize(input)).eq('id', input.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const id = input.id || req.query?.id;
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) { return fail(res, error); }
}
