import supabase from './db-client.js';
import { cors, body, dayOfWeek, datePlus, today, fail } from './_helpers.js';

const read = async (table, columns = '*') => { const { data, error } = await supabase.from(table).select(columns); if (error) { console.error(table, error.message); return []; } return data || []; };
const dateInCairo = (offset = 0) => { const d = new Date(); d.setHours(d.getHours() + 3); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
const dayInCairo = (date) => new Date(`${date}T12:00:00`).getDay();
const recurring = (groups, date) => groups.filter((g) => g.status !== 'paused' && Array.isArray(g.days) && g.days.map(Number).includes(dayInCairo(date))).map((g) => ({ ...g, date, time: g.time || '00:00', kind: 'group', title: g.name, group_name: g.name }));

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const [groups, lessons, tasks, events, students, transactions] = await Promise.all([
      read('groups'), read('lessons'), read('tasks'), read('events'), read('students'), read('transactions'),
    ]);
    const todayDate = dateInCairo(0), tomorrowDate = dateInCairo(1);
    const groupDaysToday = recurring(groups, todayDate), groupDaysTomorrow = recurring(groups, tomorrowDate);
    const lessonDate = (x) => x.date || x.lesson_date || x.deadline;
    const normalizeLesson = (x) => ({ ...x, date: lessonDate(x), time: x.time || x.lesson_time || '00:00', title: x.title || x.topic || 'حصة', group_name: x.group_name || x.group || '' });
    const lessonsToday = lessons.map(normalizeLesson).filter((x) => x.date === todayDate);
    const lessonsTomorrow = lessons.map(normalizeLesson).filter((x) => x.date === tomorrowDate);
    const eventsToday = events.filter((x) => (x.date || x.event_date) === todayDate).map((x) => ({ ...x, time: x.time || x.event_time || '00:00' }));
    const tasksToday = tasks.filter((x) => (x.deadline || x.date || x.due_date) === todayDate && !['done','cancelled'].includes(x.status));
    const tasksTomorrow = tasks.filter((x) => (x.deadline || x.date || x.due_date) === tomorrowDate && !['done','cancelled'].includes(x.status));
    const month = todayDate.slice(0, 7);
    const monthTxns = transactions.filter((x) => String(x.date || x.txn_date || x.created_at || '').slice(0, 7) === month);
    const income = monthTxns.filter((x) => x.type === 'income').reduce((s, x) => s + Number(x.amount || 0), 0);
    const expense = monthTxns.filter((x) => x.type === 'expense').reduce((s, x) => s + Number(x.amount || 0), 0);
    const sort = (a, b) => String(a.time || '23:59').localeCompare(String(b.time || '23:59'));
    const groupsToday = groupDaysToday.sort(sort), groupsTomorrow = groupDaysTomorrow.sort(sort);
    return res.status(200).json({
      today: todayDate, groupsToday, groupsTomorrow, lessonsToday, lessonsTomorrow,
      eventsToday, eventsTomorrow: events.filter((x) => (x.date || x.event_date) === tomorrowDate),
      todayTasks: tasksToday, tomorrowTasks: tasksTomorrow, topTasks: tasks.filter((x) => !['done','cancelled'].includes(x.status)).slice(0, 3),
      students, counts: { students: students.length, groups: groups.length, lessonsWeek: lessons.length },
      totalBalance: income - expense, income, expense, savings: income - expense,
      brief: { nextEvent: (groupsToday[0] || lessonsToday[0] || eventsToday[0]) ? { title: (groupsToday[0] || lessonsToday[0] || eventsToday[0]).title, when: (groupsToday[0] || lessonsToday[0] || eventsToday[0]).time || '' } : null, topTask: tasksToday[0] || null, priority: tasksToday.length ? `عندك ${tasksToday.length} مهام اليوم` : 'مفيش أولويات عاجلة', finance: `دخل الشهر ${income} • مصروف ${expense}`, suggestion: groupsToday.length ? 'عندك مواعيد النهارده.. جهّز نفسك بدري.' : 'يومك هادي.. ركز على أهم مهمة وخلصها.' },
    });
  } catch (error) { return fail(res, error); }
}
