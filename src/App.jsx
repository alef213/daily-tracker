import React, { useState, useEffect } from 'react';
import { Plus, Check, Flame, Calendar, Trash2, BookOpen, Sun, Target, Lightbulb, Heart, Moon, X, ChevronRight, ChevronLeft, Edit2, Sparkles, ArrowLeft, Settings } from 'lucide-react';

const DEFAULT_ROUTINE = [
  { id: 'morning_priorities', iconName: 'Sun', title: 'Morning Anchor', subtitle: '1-3 priorities + brain dump', hasJournal: true, journalPrompt: 'What are your 1-3 priorities today? Quick brain dump of anything on your mind...' },
  { id: 'focus_sprint', iconName: 'Target', title: 'Focus Sprint', subtitle: '60-90 min deep work block', hasJournal: false },
  { id: 'idea_capture', iconName: 'Lightbulb', title: 'Idea Capture', subtitle: 'Any ideas that came up today', hasJournal: true, journalPrompt: 'Capture ideas — no evaluation, just notice...' },
  { id: 'emotional_checkin', iconName: 'Heart', title: 'Emotional Check-in', subtitle: 'What did I feel today?', hasJournal: true, journalPrompt: 'What did you feel today? No fixing, just noticing...' },
  { id: 'rest', iconName: 'Moon', title: 'Intentional Rest', subtitle: 'Non-productive time honored', hasJournal: false },
];

const ICON_MAP = { Sun, Target, Lightbulb, Heart, Moon, Sparkles, Calendar, BookOpen };
const ICON_OPTIONS = ['Sun', 'Target', 'Lightbulb', 'Heart', 'Moon', 'Sparkles', 'Calendar', 'BookOpen'];

// localStorage helpers — replaces window.storage
const storage = {
  get: (key) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      console.error('Storage read failed:', e);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write failed:', e);
    }
  },
};

export default function DailyTracker() {
  const [habits, setHabits] = useState([]);
  const [routineItems, setRoutineItems] = useState(DEFAULT_ROUTINE);
  const [routineCompletions, setRoutineCompletions] = useState({});
  const [habitCompletions, setHabitCompletions] = useState({});
  const [journalEntries, setJournalEntries] = useState({});
  const [weeklyReflections, setWeeklyReflections] = useState({});
  const [newHabit, setNewHabit] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [activeJournal, setActiveJournal] = useState(null);
  const [journalDraft, setJournalDraft] = useState('');
  const [activeWeekly, setActiveWeekly] = useState(false);
  const [weeklyDrafts, setWeeklyDrafts] = useState({ worked: '', didnt: '', adjust: '' });
  const [view, setView] = useState('today');
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const todayActual = new Date().toISOString().split('T')[0];
  const today = selectedDate;
  const isViewingToday = selectedDate === todayActual;
  const isSunday = new Date().getDay() === 0;
  const weekKey = getWeekKey(new Date());

  function getWeekKey(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date.setDate(diff));
    return sunday.toISOString().split('T')[0];
  }

  const shiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const next = d.toISOString().split('T')[0];
    if (next > todayActual) return;
    setSelectedDate(next);
  };

  const formatSelectedDate = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    const diff = Math.round((new Date(todayActual + 'T00:00:00') - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Load from localStorage
  useEffect(() => {
    const h = storage.get('habits');
    const ri = storage.get('routine_items');
    const rc = storage.get('routine_completions');
    const hc = storage.get('habit_completions');
    const je = storage.get('journal_entries');
    const wr = storage.get('weekly_reflections');
    if (h) setHabits(h);
    if (ri) setRoutineItems(ri);
    if (rc) setRoutineCompletions(rc);
    if (hc) setHabitCompletions(hc);
    if (je) setJournalEntries(je);
    if (wr) setWeeklyReflections(wr);
    setLoading(false);
  }, []);

  const persist = (key, value) => storage.set(key, value);

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const habit = { id: Date.now().toString(), name: newHabit.trim(), createdAt: today };
    const updated = [...habits, habit];
    setHabits(updated);
    persist('habits', updated);
    setNewHabit('');
    setShowAddHabit(false);
  };

  const removeHabit = (id) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    persist('habits', updated);
  };

  const toggleHabit = (id) => {
    const updated = { ...habitCompletions };
    if (!updated[today]) updated[today] = {};
    updated[today][id] = !updated[today][id];
    setHabitCompletions(updated);
    persist('habit_completions', updated);
  };

  const toggleRoutine = (id) => {
    const updated = { ...routineCompletions };
    if (!updated[today]) updated[today] = {};
    updated[today][id] = !updated[today][id];
    setRoutineCompletions(updated);
    persist('routine_completions', updated);
  };

  const saveJournal = () => {
    if (!activeJournal) return;
    const updated = { ...journalEntries };
    if (!updated[today]) updated[today] = {};
    updated[today][activeJournal] = journalDraft;
    setJournalEntries(updated);
    persist('journal_entries', updated);
    setActiveJournal(null);
    setJournalDraft('');
  };

  const openJournal = (id) => {
    setActiveJournal(id);
    setJournalDraft(journalEntries[today]?.[id] || '');
  };

  const openWeekly = () => {
    const existing = weeklyReflections[weekKey] || { worked: '', didnt: '', adjust: '' };
    setWeeklyDrafts(existing);
    setActiveWeekly(true);
  };

  const saveWeekly = () => {
    const updated = { ...weeklyReflections, [weekKey]: weeklyDrafts };
    setWeeklyReflections(updated);
    persist('weekly_reflections', updated);
    setActiveWeekly(false);
  };

  const saveRoutineItem = (item) => {
    const exists = routineItems.find(r => r.id === item.id);
    let updated;
    if (exists) {
      updated = routineItems.map(r => r.id === item.id ? item : r);
    } else {
      updated = [...routineItems, item];
    }
    setRoutineItems(updated);
    persist('routine_items', updated);
    setEditingRoutine(null);
  };

  const deleteRoutineItem = (id) => {
    const updated = routineItems.filter(r => r.id !== id);
    setRoutineItems(updated);
    persist('routine_items', updated);
  };

  const moveRoutineItem = (id, direction) => {
    const idx = routineItems.findIndex(r => r.id === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= routineItems.length) return;
    const updated = [...routineItems];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setRoutineItems(updated);
    persist('routine_items', updated);
  };

  const calcStreak = (completions, id) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (completions[key]?.[id]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        if (key === todayActual && streak === 0) {
          d.setDate(d.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  };

  const get30DayData = (completions, id) => {
    const data = [];
    const d = new Date();
    d.setDate(d.getDate() - 29);
    for (let i = 0; i < 30; i++) {
      const key = d.toISOString().split('T')[0];
      data.push({ date: key, done: !!completions[key]?.[id] });
      d.setDate(d.getDate() + 1);
    }
    return data;
  };

  const calc30DayRate = (completions, id) => {
    const data = get30DayData(completions, id);
    const done = data.filter(d => d.done).length;
    return Math.round((done / 30) * 100);
  };

  const todayHabits = habitCompletions[today] || {};
  const todayRoutine = routineCompletions[today] || {};
  const completedToday = Object.values(todayHabits).filter(Boolean).length + Object.values(todayRoutine).filter(Boolean).length;
  const totalToday = habits.length + routineItems.length;
  const weeklyDone = !!weeklyReflections[weekKey] && (weeklyReflections[weekKey].worked || weeklyReflections[weekKey].didnt || weeklyReflections[weekKey].adjust);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm tracking-wide">loading...</div>
      </div>
    );
  }

  // JOURNAL HISTORY VIEW
  if (view === 'journal') {
    const allDates = new Set([...Object.keys(journalEntries), ...Object.keys(weeklyReflections)]);
    const sortedDates = Array.from(allDates).sort().reverse();
    const sortedWeeks = Object.keys(weeklyReflections).sort().reverse();

    return (
      <div className="min-h-screen bg-stone-50 text-stone-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-20">
          <button onClick={() => setView('today')} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
            <ArrowLeft size={16} /> Back to today
          </button>
          <h1 className="text-3xl font-light text-stone-900 mb-8">Past Entries</h1>

          {sortedWeeks.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-4 font-medium">Weekly Reflections</h2>
              <div className="space-y-3">
                {sortedWeeks.map(wk => {
                  const r = weeklyReflections[wk];
                  if (!r.worked && !r.didnt && !r.adjust) return null;
                  return (
                    <div key={wk} className="bg-white border border-stone-200 rounded-lg p-5">
                      <div className="text-xs text-stone-400 uppercase tracking-widest mb-3">
                        Week of {new Date(wk).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      {r.worked && (
                        <div className="mb-3">
                          <div className="text-xs text-stone-500 mb-1">What worked</div>
                          <div className="text-sm text-stone-800 whitespace-pre-wrap">{r.worked}</div>
                        </div>
                      )}
                      {r.didnt && (
                        <div className="mb-3">
                          <div className="text-xs text-stone-500 mb-1">What didn't feel right</div>
                          <div className="text-sm text-stone-800 whitespace-pre-wrap">{r.didnt}</div>
                        </div>
                      )}
                      {r.adjust && (
                        <div>
                          <div className="text-xs text-stone-500 mb-1">What to adjust</div>
                          <div className="text-sm text-stone-800 whitespace-pre-wrap">{r.adjust}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-4 font-medium">Daily Entries</h2>
            <div className="space-y-3">
              {sortedDates.filter(d => journalEntries[d] && Object.values(journalEntries[d]).some(v => v)).map(date => (
                <div key={date} className="bg-white border border-stone-200 rounded-lg p-5">
                  <div className="text-xs text-stone-400 uppercase tracking-widest mb-3">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  {Object.entries(journalEntries[date]).map(([itemId, text]) => {
                    if (!text) return null;
                    const item = routineItems.find(r => r.id === itemId) || DEFAULT_ROUTINE.find(r => r.id === itemId);
                    return (
                      <div key={itemId} className="mb-3 last:mb-0">
                        <div className="text-xs text-stone-500 mb-1">{item?.title || itemId}</div>
                        <div className="text-sm text-stone-800 whitespace-pre-wrap">{text}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {sortedDates.filter(d => journalEntries[d] && Object.values(journalEntries[d]).some(v => v)).length === 0 && (
                <div className="text-center py-12 text-stone-300 text-sm">No journal entries yet</div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ROUTINE SETTINGS VIEW
  if (view === 'routine_settings') {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div className="max-w-2xl mx-auto px-6 pt-10 pb-20">
          <button onClick={() => setView('today')} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
            <ArrowLeft size={16} /> Back to today
          </button>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light text-stone-900">Edit Routine</h1>
            <button
              onClick={() => setEditingRoutine({ id: 'new_' + Date.now(), iconName: 'Sparkles', title: '', subtitle: '', hasJournal: false, journalPrompt: '' })}
              className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-2">
            {routineItems.map((item, idx) => {
              const Icon = ICON_MAP[item.iconName] || Sparkles;
              return (
                <div key={item.id} className="bg-white border border-stone-200 rounded-lg p-4 flex items-center">
                  <Icon size={16} className="text-stone-400 flex-shrink-0" />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-800">{item.title}</div>
                    <div className="text-xs text-stone-400">{item.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => moveRoutineItem(item.id, -1)} disabled={idx === 0} className="text-stone-300 hover:text-stone-600 disabled:opacity-30 px-1">↑</button>
                    <button onClick={() => moveRoutineItem(item.id, 1)} disabled={idx === routineItems.length - 1} className="text-stone-300 hover:text-stone-600 disabled:opacity-30 px-1">↓</button>
                    <button onClick={() => setEditingRoutine(item)} className="text-stone-400 hover:text-stone-700 p-1"><Edit2 size={13} /></button>
                    <button onClick={() => deleteRoutineItem(item.id)} className="text-stone-300 hover:text-red-500 p-1"><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => { setRoutineItems(DEFAULT_ROUTINE); persist('routine_items', DEFAULT_ROUTINE); }}
            className="mt-8 text-xs text-stone-400 hover:text-stone-700"
          >
            Reset to defaults
          </button>
        </div>

        {editingRoutine && (
          <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingRoutine(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-light text-stone-900 mb-4">{routineItems.find(r => r.id === editingRoutine.id) ? 'Edit' : 'New'} Routine Item</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Title</label>
                  <input
                    value={editingRoutine.title}
                    onChange={(e) => setEditingRoutine({ ...editingRoutine, title: e.target.value })}
                    placeholder="Morning anchor"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Description</label>
                  <input
                    value={editingRoutine.subtitle}
                    onChange={(e) => setEditingRoutine({ ...editingRoutine, subtitle: e.target.value })}
                    placeholder="A short description"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map(name => {
                      const Icon = ICON_MAP[name];
                      const selected = editingRoutine.iconName === name;
                      return (
                        <button
                          key={name}
                          onClick={() => setEditingRoutine({ ...editingRoutine, iconName: name })}
                          className={`p-2 rounded-lg border ${selected ? 'border-stone-700 bg-stone-100' : 'border-stone-200 hover:border-stone-400'}`}
                        >
                          <Icon size={16} className="text-stone-600" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input
                      type="checkbox"
                      checked={editingRoutine.hasJournal}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, hasJournal: e.target.checked })}
                      className="accent-stone-700"
                    />
                    Include journal prompt
                  </label>
                </div>
                {editingRoutine.hasJournal && (
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Journal prompt</label>
                    <textarea
                      value={editingRoutine.journalPrompt}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, journalPrompt: e.target.value })}
                      placeholder="What prompt should appear when journaling?"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 text-sm h-20 resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setEditingRoutine(null)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800">Cancel</button>
                <button
                  onClick={() => editingRoutine.title.trim() && saveRoutineItem(editingRoutine)}
                  className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-900"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MAIN VIEW
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => shiftDate(-1)}
                className="text-stone-400 hover:text-stone-700 transition-colors p-1 -ml-1"
                title="Previous day"
              >
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-3xl font-light tracking-tight text-stone-900">
                {formatSelectedDate()}
              </h1>
              <button
                onClick={() => shiftDate(1)}
                disabled={isViewingToday}
                className="text-stone-400 hover:text-stone-700 transition-colors p-1 disabled:opacity-20 disabled:cursor-not-allowed"
                title="Next day"
              >
                <ChevronRight size={20} />
              </button>
              {!isViewingToday && (
                <button
                  onClick={() => setSelectedDate(todayActual)}
                  className="text-xs text-stone-500 hover:text-stone-800 ml-2 px-2 py-1 rounded border border-stone-200 hover:border-stone-400 transition-colors"
                >
                  Jump to today
                </button>
              )}
            </div>
            <p className="text-sm text-stone-500 mt-1 ml-9">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setView('journal')} className="text-stone-400 hover:text-stone-700 transition-colors" title="Past entries">
              <BookOpen size={18} />
            </button>
            <button onClick={() => setView('routine_settings')} className="text-stone-400 hover:text-stone-700 transition-colors" title="Routine settings">
              <Settings size={18} />
            </button>
            <div className="text-right ml-2">
              <div className="text-2xl font-light text-stone-700">{completedToday}<span className="text-stone-300">/{totalToday}</span></div>
              <div className="text-xs text-stone-400 uppercase tracking-widest mt-1">{isViewingToday ? 'today' : 'this day'}</div>
            </div>
          </div>
        </div>
      </div>

      {isSunday && !weeklyDone && (
        <div className="max-w-6xl mx-auto px-6 mb-4">
          <button
            onClick={openWeekly}
            className="w-full bg-gradient-to-r from-stone-100 to-amber-50 border border-amber-200/50 rounded-lg p-4 flex items-center justify-between hover:from-stone-200 hover:to-amber-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <Sparkles size={16} className="text-amber-700" />
              <div className="text-left">
                <div className="text-sm font-medium text-stone-800">Weekly Reflection</div>
                <div className="text-xs text-stone-500">It's Sunday — a few minutes to reset</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </button>
        </div>
      )}

      {weeklyDone && isSunday && (
        <div className="max-w-6xl mx-auto px-6 mb-4">
          <button
            onClick={openWeekly}
            className="w-full bg-stone-100/50 border border-stone-200 rounded-lg p-3 flex items-center justify-between hover:bg-stone-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <Check size={14} className="text-stone-500" />
              <div className="text-sm text-stone-600">Weekly reflection complete · tap to view</div>
            </div>
            <ChevronRight size={14} className="text-stone-400" />
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        <div className="lg:col-span-3 space-y-8">
          
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest text-stone-400 font-medium">Daily Routine</h2>
              <button onClick={() => setView('routine_settings')} className="text-stone-300 hover:text-stone-600 text-xs">
                Edit
              </button>
            </div>
            <div className="space-y-2">
              {routineItems.map(item => {
                const Icon = ICON_MAP[item.iconName] || Sparkles;
                const done = todayRoutine[item.id];
                const streak = calcStreak(routineCompletions, item.id);
                const hasEntry = journalEntries[today]?.[item.id];
                return (
                  <div key={item.id} className={`group bg-white rounded-lg border transition-all ${done ? 'border-stone-200 bg-stone-50/50' : 'border-stone-200 hover:border-stone-300'}`}>
                    <div className="flex items-center p-4">
                      <button
                        onClick={() => toggleRoutine(item.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${done ? 'bg-stone-700 border-stone-700' : 'border-stone-300 hover:border-stone-500'}`}
                      >
                        {done && <Check size={14} className="text-white" strokeWidth={3} />}
                      </button>
                      <Icon size={16} className="ml-4 text-stone-400 flex-shrink-0" />
                      <div className="ml-3 flex-1 min-w-0">
                        <div className={`text-sm font-medium ${done ? 'text-stone-400 line-through' : 'text-stone-800'}`}>{item.title}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{item.subtitle}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <Flame size={12} />
                            <span>{streak}</span>
                          </div>
                        )}
                        {item.hasJournal && (
                          <button
                            onClick={() => openJournal(item.id)}
                            className={`p-1.5 rounded transition-colors ${hasEntry ? 'text-stone-600' : 'text-stone-300 hover:text-stone-500'}`}
                          >
                            <BookOpen size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest text-stone-400 font-medium">My Habits</h2>
              <button
                onClick={() => setShowAddHabit(true)}
                className="text-stone-400 hover:text-stone-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {showAddHabit && (
              <div className="mb-3 bg-white border border-stone-200 rounded-lg p-3 flex gap-2">
                <input
                  type="text"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                  placeholder="A habit to build..."
                  className="flex-1 bg-transparent outline-none text-sm text-stone-800 placeholder:text-stone-300"
                  autoFocus
                />
                <button onClick={addHabit} className="text-xs text-stone-600 hover:text-stone-900 px-2">Add</button>
                <button onClick={() => { setShowAddHabit(false); setNewHabit(''); }} className="text-stone-300 hover:text-stone-500">
                  <X size={14} />
                </button>
              </div>
            )}

            {habits.length === 0 && !showAddHabit ? (
              <div className="text-center py-8 text-stone-300 text-sm border border-dashed border-stone-200 rounded-lg">
                Add a habit to begin
              </div>
            ) : (
              <div className="space-y-2">
                {habits.map(habit => {
                  const done = todayHabits[habit.id];
                  const streak = calcStreak(habitCompletions, habit.id);
                  return (
                    <div key={habit.id} className={`group bg-white rounded-lg border transition-all ${done ? 'border-stone-200 bg-stone-50/50' : 'border-stone-200 hover:border-stone-300'}`}>
                      <div className="flex items-center p-4">
                        <button
                          onClick={() => toggleHabit(habit.id)}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${done ? 'bg-stone-700 border-stone-700' : 'border-stone-300 hover:border-stone-500'}`}
                        >
                          {done && <Check size={14} className="text-white" strokeWidth={3} />}
                        </button>
                        <div className="ml-4 flex-1 min-w-0">
                          <div className={`text-sm font-medium ${done ? 'text-stone-400 line-through' : 'text-stone-800'}`}>{habit.name}</div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {streak > 0 && (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                              <Flame size={12} />
                              <span>{streak}</span>
                            </div>
                          )}
                          <button
                            onClick={() => removeHabit(habit.id)}
                            className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-stone-500 transition-opacity"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {!isSunday && (
            <section>
              <button
                onClick={openWeekly}
                className="w-full text-left bg-white border border-stone-200 rounded-lg p-4 hover:border-stone-300 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={14} className="text-stone-400" />
                  <div className="text-sm text-stone-600">
                    {weeklyDone ? 'Edit this week\'s reflection' : 'Open weekly reflection'}
                  </div>
                </div>
                <ChevronRight size={14} className="text-stone-300" />
              </button>
            </section>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xs uppercase tracking-widest text-stone-400 font-medium">Patterns</h2>
          
          <div className="bg-white border border-stone-200 rounded-lg p-5">
            <div className="text-xs text-stone-400 uppercase tracking-widest mb-3">30-Day Overview</div>
            <div className="space-y-4">
              {[...routineItems.map(r => ({ ...r, _src: routineCompletions })), ...habits.map(h => ({ ...h, title: h.name, _src: habitCompletions }))].map(item => {
                const data = get30DayData(item._src, item.id);
                const rate = calc30DayRate(item._src, item.id);
                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs text-stone-600 truncate pr-2">{item.title}</div>
                      <div className="text-xs text-stone-400 flex-shrink-0">{rate}%</div>
                    </div>
                    <div className="flex gap-0.5 h-5">
                      {data.map((d, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm ${d.done ? 'bg-stone-700' : 'bg-stone-100'}`}
                          title={d.date}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {habits.length === 0 && routineItems.length === 0 && (
                <div className="text-xs text-stone-300 text-center pt-2">Patterns build over time</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-5">
            <div className="text-xs text-stone-400 uppercase tracking-widest mb-3">Today</div>
            <div className="flex items-end gap-2">
              <div className="text-4xl font-light text-stone-800">
                {totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0}
              </div>
              <div className="text-stone-400 mb-1.5 text-sm">%</div>
            </div>
            <div className="mt-3 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-700 transition-all duration-500"
                style={{ width: `${totalToday > 0 ? (completedToday / totalToday) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-5">
            <div className="text-xs text-stone-400 uppercase tracking-widest mb-3">Active Streaks</div>
            <div className="space-y-2">
              {[...routineItems.map(r => ({ id: r.id, name: r.title, streak: calcStreak(routineCompletions, r.id) })),
                ...habits.map(h => ({ id: h.id, name: h.name, streak: calcStreak(habitCompletions, h.id) }))]
                .filter(s => s.streak > 0)
                .sort((a, b) => b.streak - a.streak)
                .slice(0, 5)
                .map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div className="text-stone-600 truncate pr-2">{s.name}</div>
                    <div className="flex items-center gap-1 text-amber-600 flex-shrink-0">
                      <Flame size={12} />
                      <span className="text-xs">{s.streak}d</span>
                    </div>
                  </div>
                ))}
              {[...routineItems.map(r => calcStreak(routineCompletions, r.id)), ...habits.map(h => calcStreak(habitCompletions, h.id))].every(s => s === 0) && (
                <div className="text-xs text-stone-300 text-center py-2">Start a streak today</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeJournal && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setActiveJournal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light text-stone-900">
                {routineItems.find(r => r.id === activeJournal)?.title}
              </h3>
              <button onClick={() => setActiveJournal(null)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-stone-400 mb-3 italic">
              {routineItems.find(r => r.id === activeJournal)?.journalPrompt}
            </p>
            <textarea
              value={journalDraft}
              onChange={(e) => setJournalDraft(e.target.value)}
              placeholder="Begin writing..."
              className="w-full h-48 p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 text-sm text-stone-800 placeholder:text-stone-300 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setActiveJournal(null)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800 transition-colors">Cancel</button>
              <button onClick={saveJournal} className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {activeWeekly && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setActiveWeekly(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-light text-stone-900 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-600" />
                Weekly Reflection
              </h3>
              <button onClick={() => setActiveWeekly(false)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-stone-400 mb-5">Turn experience into self-awareness. 15-30 minutes.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-stone-500 uppercase tracking-widest block mb-2">What worked this week?</label>
                <textarea
                  value={weeklyDrafts.worked}
                  onChange={(e) => setWeeklyDrafts({ ...weeklyDrafts, worked: e.target.value })}
                  placeholder="Wins, momentum, what felt aligned..."
                  className="w-full h-24 p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 uppercase tracking-widest block mb-2">What didn't feel right?</label>
                <textarea
                  value={weeklyDrafts.didnt}
                  onChange={(e) => setWeeklyDrafts({ ...weeklyDrafts, didnt: e.target.value })}
                  placeholder="Friction, drift, what felt off..."
                  className="w-full h-24 p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 uppercase tracking-widest block mb-2">What to adjust next week?</label>
                <textarea
                  value={weeklyDrafts.adjust}
                  onChange={(e) => setWeeklyDrafts({ ...weeklyDrafts, adjust: e.target.value })}
                  placeholder="One or two specific changes..."
                  className="w-full h-24 p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setActiveWeekly(false)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800">Cancel</button>
              <button onClick={saveWeekly} className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-900">Save reflection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}