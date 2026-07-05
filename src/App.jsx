import { useState, useEffect, useRef } from "react";

// ---------- helpers ----------
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayISO = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
const startOfWeek = (d = new Date()) => {
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7; // Mon=0
  dt.setDate(dt.getDate() - day);
  dt.setHours(0, 0, 0, 0);
  return dt;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const fmtDay = (d) => d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

const DEFAULT_HABITS = [
  { id: "h1", name: "Strength at the gym", days: [6, 0], min: "20 min: squat + deadlift + negative pull-ups", phase: 1 },
  { id: "h2", name: "Home mini-session (balance + technique + core)", days: [1, 2, 3, 4, 5], min: "5 min: plank + single-leg balance", phase: 1 },
  { id: "h3", name: "Protein 3x per day, 25–30 g each", days: [0, 1, 2, 3, 4, 5, 6], min: "At least 2 protein meals", phase: 1 },
  { id: "h4", name: "Veggie of the day (micro-portion)", days: [0, 1, 2, 3, 4, 5, 6], min: "1 spoon / 2 pieces — just try it", phase: 1 },
  { id: "h5", name: "Social media — only after the day's tasks", days: [1, 2, 3, 4, 5], min: "Don't open before lunch", phase: 3 },
  { id: "h6", name: "Guitar 15 min (from phase 2)", days: [0, 1, 2, 3, 4], min: "5 min: one chord change / one riff", phase: 2 },
  { id: "h7", name: "Order groceries for meal prep", days: [5], min: "Order at least chicken + cottage cheese + grain", phase: 2 },
  { id: "h8", name: "Laundry", days: [3, 0], min: "Starting the machine counts", phase: 2 },
  { id: "h9", name: "20-min timed cleanup", days: [6], min: "10 min, kitchen only", phase: 2 },
  { id: "h10", name: "Creatine 5 g", days: [0, 1, 2, 3, 4, 5, 6], min: "—", phase: 1 },
];

const WEEK_PLAN = [
  {
    day: "Nutrition (every day)",
    items: [
      "Morning: cappuccino + 200 g cottage cheese with fruit (from a jar, 5 min) ≈ 33 g protein",
      "Lunch: meal box — chicken in soy sauce 150 g + buckwheat/rice 150 g + air-fried veggies ≈ 40 g protein",
      "Dinner: meal box — chicken 120–130 g + side ≈ 33 g protein",
      "Protein shake: 1 scoop after workout (on training days)",
      "Creatine: 5 g every day, + 0.5 L water. First 2 weeks +0.5–1 kg water weight is normal",
      "Sweets — Sunday trophy if ≥80%",
    ],
  },
  {
    day: "Monday · Balance + core (15–20 min, 30 sec rest)",
    items: [
      "Single-leg balance 3×30 sec/leg (week 3+: eyes closed; week 6+: on a pillow)",
      "Plank 3×40 sec · Glute bridge 3×15 · Ball control/dribbling 5 min",
      "Guitar 15 min → then social media",
    ],
  },
  {
    day: "Tuesday · Running technique",
    items: [
      "Jump rope 4×1 min — land on forefoot, softly (45 sec rest)",
      "High knees in place 3×20 sec · 45° wall drill: hip drive 3×10/leg",
      "Guitar 15 min",
    ],
  },
  {
    day: "Wednesday · Core + mobility",
    items: [
      "Side plank 3×30 sec/side · Dead bug 3×10",
      "Hip, glute, and ankle stretching 7–8 min",
      "Laundry · Guitar 15 min",
    ],
  },
  {
    day: "Thursday · Explosive base",
    items: [
      "Half-squat jumps 3×8, soft landing (60 sec rest!)",
      "Half-squat lateral steps 3×20 sec · Single-leg hops over a line 3×10/leg · Ball control 5 min",
      "Guitar 15 min",
    ],
  },
  {
    day: "Friday · Rest",
    items: ["Grocery order (10 min) · Walk · Early sleep — gym tomorrow"],
  },
  {
    day: "Saturday 9:00 · Strength A — Cable machine (~50 min)",
    items: [
      "Warm-up 5 min: jump rope + joint mobility",
      "Cable squat, cables at chest 4×8 (90 sec rest) · Romanian deadlift, low cables 3×10 (90 sec)",
      "Close-grip lat pulldown 4×8 (60 sec) · NEGATIVE pull-ups 4×3, 5-sec lowering (90 sec)",
      "Pallof press 3×10/side (30 sec) · Stretch 3 min",
      "Afternoon: meal prep 1.5 h (chicken 2 kg in soy sauce + air-fried veggies, grain 700 g, cottage cheese in jars ×5, 10 containers) · Cleanup 20 min",
    ],
  },
  {
    day: "Sunday 9:00 · Strength B — Cable machine (~50 min)",
    items: [
      "Warm-up 5 min",
      "One-arm row 4×8/arm (60 sec) · Standing cable chest press 3×10 (90 sec)",
      "Cable reverse lunge 3×10/leg (60 sec) · One-arm overhead press 3×8/arm (60 sec)",
      "Single-leg calf raise 3×12/leg (30 sec) · Side plank 3×30 sec/side",
      "Laundry · Evening: guitar + reward 🍫 if ≥80%",
      "Progression everywhere: all sets clean → +weight or +1 rep",
    ],
  },
];

const VEGGIE_LADDER = [
  "Level 1 — Hidden: carrot in pilaf, tomato in sauce, pumpkin cream soup",
  "Level 2 — Roasted with seasoning: potato + carrot + paprika, grilled zucchini",
  "Level 3 — Part of a dish but visible: veggies in lagman, bell pepper in stir-fry",
  "Level 4 — Separate side dish: roasted broccoli with cheese, green beans with garlic",
  "Level 5 — Fresh: cucumber with salt, cherry tomatoes, carrot sticks with hummus",
];
const VEGGIE_SHORT = ["hidden", "roasted", "visible in dish", "separate side", "fresh"];
const VEGGIE_HABIT_ID = "h4";

const STORAGE_KEY = "gt-data-v1";
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
const emptyHabitForm = { id: null, name: "", days: [], min: "", phase: 1 };
const MAX_BACK_DAYS = 7;

const TABS = [
  ["today", "Today"],
  ["plan", "Plan"],
  ["habits", "Habits"],
  ["ideas", "Ideas"],
  ["rules", "Rules"],
];

export default function GulnurTracker() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("today");
  const [ideaText, setIdeaText] = useState("");
  const [saveState, setSaveState] = useState("");
  const [habitForm, setHabitForm] = useState(null); // null = closed, else emptyHabitForm-shaped
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, negative = past
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [veggieExpanded, setVeggieExpanded] = useState(false);

  // ---------- swipe ----------
  const trackRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, active: false, horizontal: false });
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const tabIndex = TABS.findIndex(([k]) => k === tab);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, active: true, horizontal: false };
  };
  const onTouchMove = (e) => {
    const st = touchRef.current;
    if (!st.active) return;
    const t = e.touches[0];
    const dx = t.clientX - st.startX;
    const dy = t.clientY - st.startY;
    if (!st.horizontal) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      st.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!st.horizontal) return;
    }
    setDragging(true);
    setDragX(dx);
  };
  const onTouchEnd = () => {
    const st = touchRef.current;
    if (st.active && st.horizontal) {
      const width = trackRef.current?.offsetWidth || 1;
      const threshold = width * 0.18;
      if (dragX < -threshold && tabIndex < TABS.length - 1) {
        setTab(TABS[tabIndex + 1][0]);
      } else if (dragX > threshold && tabIndex > 0) {
        setTab(TABS[tabIndex - 1][0]);
      }
    }
    touchRef.current = { startX: 0, startY: 0, active: false, horizontal: false };
    setDragging(false);
    setDragX(0);
  };

  // ---------- load (with migration) ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw);
      const withPhase = parsed.habits.map((h) => {
        if (h.phase) return h;
        const def = DEFAULT_HABITS.find((d) => d.id === h.id);
        return { ...h, phase: def ? def.phase : 1 };
      });
      const ids = new Set(withPhase.map((h) => h.id));
      const merged = [...withPhase, ...DEFAULT_HABITS.filter((h) => !ids.has(h.id))];
      setData({
        ...parsed,
        habits: merged,
        // pre-existing installs had no phase gating — unlock everything so nothing suddenly disappears
        currentPhase: parsed.currentPhase ?? 3,
        veggieLevel: parsed.veggieLevel ?? 1,
      });
    } catch {
      setData({
        habits: DEFAULT_HABITS,
        log: {},
        ideas: [],
        veggieLevel: 1,
        currentPhase: 1,
        startDate: todayISO(),
      });
    }
  }, []);

  const persist = (next) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveState("Saved");
      setTimeout(() => setSaveState(""), 1200);
    } catch {
      setSaveState("Save error");
    }
  };

  if (!data)
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#F2F0E9", fontFamily: "sans-serif" }}>Loading…</div>
      </div>
    );

  // ---------- computations ----------
  const now = new Date();
  const tISO = todayISO(now);
  const weekStart = startOfWeek(now);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const isHabitActive = (h) => (h.phase ?? 1) <= data.currentPhase;
  const habitsForDate = (d) => data.habits.filter((h) => h.days.includes(d.getDay()));

  const dayScore = (d) => {
    const iso = todayISO(d);
    const hs = habitsForDate(d).filter(isHabitActive);
    if (!hs.length) return { done: 0, total: 0 };
    const done = hs.filter((h) => data.log[iso]?.[h.id]).length;
    return { done, total: hs.length };
  };

  const weekStats = (() => {
    let done = 0, total = 0;
    for (const d of weekDates) {
      if (d > now) continue;
      const s = dayScore(d);
      done += s.done;
      total += s.total;
    }
    let planned = 0;
    for (const d of weekDates) planned += habitsForDate(d).filter(isHabitActive).length;
    return { done, total, planned, pct: planned ? Math.round((done / planned) * 100) : 0 };
  })();

  const streak = (() => {
    let s = 0;
    let d = new Date(now);
    const todayDone = dayScore(d).done > 0;
    if (!todayDone) d = addDays(d, -1);
    while (true) {
      const sc = dayScore(d);
      if (sc.total === 0) { d = addDays(d, -1); continue; }
      if (sc.done === 0) break;
      s++;
      d = addDays(d, -1);
      if (s > 730) break;
    }
    return s;
  })();

  const toggle = (iso, habitId, mode) => {
    const log = { ...data.log };
    const day = { ...(log[iso] || {}) };
    day[habitId] = day[habitId] === mode ? null : mode;
    if (!day[habitId]) delete day[habitId];
    log[iso] = day;
    persist({ ...data, log });
  };

  const openNewHabit = (prefillName = "") => setHabitForm({ ...emptyHabitForm, name: prefillName });
  const openEditHabit = (h) => setHabitForm({ id: h.id, name: h.name, days: [...h.days], min: h.min, phase: h.phase ?? 1 });
  const closeHabitForm = () => setHabitForm(null);
  const toggleFormDay = (day) => {
    setHabitForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };
  const saveHabitForm = () => {
    if (!habitForm.name.trim() || habitForm.days.length === 0) return;
    const clean = { ...habitForm, name: habitForm.name.trim(), min: habitForm.min.trim() };
    if (clean.id) {
      persist({ ...data, habits: data.habits.map((h) => (h.id === clean.id ? { ...h, ...clean } : h)) });
    } else {
      persist({ ...data, habits: [...data.habits, { id: `h${Date.now()}`, name: clean.name, days: clean.days, min: clean.min, phase: clean.phase }] });
    }
    setHabitForm(null);
  };
  const deleteHabit = (id) => {
    persist({ ...data, habits: data.habits.filter((h) => h.id !== id) });
  };
  const convertIdeaToHabit = (idea) => {
    persist({ ...data, ideas: data.ideas.filter((x) => x.id !== idea.id) });
    setTab("habits");
    setHabitForm({ ...emptyHabitForm, name: idea.text });
  };

  const goPrevDay = () => setDayOffset((o) => Math.max(-MAX_BACK_DAYS, o - 1));
  const goNextDay = () => setDayOffset((o) => Math.min(0, o + 1));
  const goToday = () => setDayOffset(0);

  const viewDate = addDays(now, dayOffset);
  const viewISO = todayISO(viewDate);
  const isViewingToday = dayOffset === 0;

  const allViewHabits = habitsForDate(viewDate);
  const activeViewHabits = allViewHabits.filter(isHabitActive);
  const upcomingViewHabits = allViewHabits.filter((h) => !isHabitActive(h));
  const viewDoneCount = activeViewHabits.filter((h) => data.log[viewISO]?.[h.id]).length;
  const missedView = activeViewHabits.length - viewDoneCount;

  const rewardUnlocked = weekStats.pct >= 80;

  // ---------- UI ----------
  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Manrope:wght@400;600;800&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; }
        button:disabled { cursor: default; opacity: 0.3; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      {/* SCOREBOARD */}
      <div style={S.board}>
        <div style={S.boardTop}>
          <span style={S.eyebrow}>MATCH OF THE WEEK</span>
          <span style={{ ...S.eyebrow, color: "#FF6A2B" }}>{saveState}</span>
        </div>
        <div style={S.scoreRow}>
          <div style={S.teamCol}>
            <div style={S.teamName}>GULNUR</div>
            <div style={S.bigScore}>{weekStats.done}</div>
          </div>
          <div style={S.vs}>
            <div style={S.pct}>{weekStats.pct}%</div>
            <div style={S.pctLabel}>of {weekStats.planned} tasks</div>
          </div>
          <div style={S.teamCol}>
            <div style={{ ...S.teamName, color: "#8A93A6" }}>YESTERDAY'S ME</div>
            <div style={{ ...S.bigScore, color: "#8A93A6" }}>
              {Math.max(0, weekStats.total - weekStats.done)}
            </div>
          </div>
        </div>
        <div style={S.streakRow}>
          <span style={S.streakChip}>🔥 Streak: {streak} {streak === 1 ? "day" : "days"}</span>
          <span style={{ ...S.streakChip, background: rewardUnlocked ? "#2E7D4F" : "#1C2A44" }}>
            {rewardUnlocked ? "🍫 Reward unlocked" : `${80 - weekStats.pct > 0 ? 80 - weekStats.pct : 0}% to reward`}
          </span>
        </div>
        <div style={S.ticksRow}>
          {weekDates.map((d, i) => {
            const s = dayScore(d);
            const future = d > now && todayISO(d) !== tISO;
            const full = s.total > 0 && s.done === s.total;
            const some = s.done > 0;
            return (
              <div key={i} style={S.tickCol}>
                <div
                  style={{
                    ...S.tick,
                    background: future ? "transparent" : full ? "#FF6A2B" : some ? "#D9A441" : s.total === 0 ? "#1C2A44" : "#3A2530",
                    border: todayISO(d) === tISO ? "2px solid #F2F0E9" : "2px solid transparent",
                  }}
                />
                <span style={S.tickLabel}>{DAYS[d.getDay()]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{ ...S.tab, ...(tab === k ? S.tabActive : {}) }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SWIPEABLE PANELS */}
      <div style={S.swipeViewport} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div
          ref={trackRef}
          style={{
            ...S.swipeTrack,
            transform: `translateX(calc(${-tabIndex * 100}% + ${dragX}px))`,
            transition: dragging ? "none" : "transform 0.28s cubic-bezier(.22,.9,.34,1)",
          }}
        >
          {/* TODAY */}
          <div style={S.swipePanel}>
            <div style={S.section}>
              <div style={S.dayNavRow}>
                <button style={S.dayNavBtn} onClick={goPrevDay} disabled={dayOffset <= -MAX_BACK_DAYS}>
                  ←
                </button>
                <div style={S.dayNavLabel}>{fmtDay(viewDate)}</div>
                <button style={S.dayNavBtn} onClick={goNextDay} disabled={dayOffset >= 0}>
                  →
                </button>
              </div>
              {!isViewingToday && (
                <div style={S.editingBanner}>
                  <span>✏️ Editing {fmtDay(viewDate)}</span>
                  <button style={S.btnSmall} onClick={goToday}>
                    Today
                  </button>
                </div>
              )}

              {activeViewHabits.length === 0 && (
                <div style={S.card}>Recovery day — no tasks. Streak stays intact.</div>
              )}
              {activeViewHabits.map((h) => {
                const state = data.log[viewISO]?.[h.id];
                const isVeggie = h.id === VEGGIE_HABIT_ID;
                return (
                  <div key={h.id} style={{ ...S.card, opacity: state ? 0.75 : 1 }}>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: isVeggie ? "pointer" : "default" }}
                      onClick={() => isVeggie && setVeggieExpanded((v) => !v)}
                    >
                      <div>
                        <div style={S.habitName}>
                          {state === "full" ? "✅ " : state === "min" ? "🟡 " : ""}
                          {h.name}
                        </div>
                        <div style={S.minText}>
                          Minimum: {h.min}
                          {isVeggie && ` · Level ${data.veggieLevel}: ${VEGGIE_SHORT[data.veggieLevel - 1]}`}
                        </div>
                      </div>
                      {isVeggie && <span style={S.infoIcon}>{veggieExpanded ? "▲" : "ⓘ"}</span>}
                    </div>
                    {isVeggie && veggieExpanded && (
                      <div style={S.veggieDetail} onClick={(e) => e.stopPropagation()}>
                        {VEGGIE_LADDER.map((v, i) => (
                          <div
                            key={i}
                            style={{
                              ...S.veggieStep,
                              borderLeft: `4px solid ${i + 1 < data.veggieLevel ? "#2E7D4F" : i + 1 === data.veggieLevel ? "#FF6A2B" : "#33456B"}`,
                              opacity: i + 1 > data.veggieLevel ? 0.55 : 1,
                            }}
                          >
                            {v}
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button style={S.btnSmall} onClick={() => persist({ ...data, veggieLevel: Math.min(5, data.veggieLevel + 1) })}>
                            Level complete →
                          </button>
                          <button style={S.btnSmall} onClick={() => persist({ ...data, veggieLevel: Math.max(1, data.veggieLevel - 1) })}>
                            ← Back
                          </button>
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => toggle(viewISO, h.id, "full")}
                        style={{ ...S.btn, background: state === "full" ? "#FF6A2B" : "#22355A" }}
                      >
                        Done
                      </button>
                      <button
                        onClick={() => toggle(viewISO, h.id, "min")}
                        style={{ ...S.btnGhost, borderColor: state === "min" ? "#D9A441" : "#33456B" }}
                      >
                        Minimum
                      </button>
                    </div>
                  </div>
                );
              })}
              {missedView === 0 && activeViewHabits.length > 0 && (
                <div style={{ ...S.card, background: "#173325", border: "1px solid #2E7D4F" }}>
                  Perfect day. This is what someone who won't recognize themselves in a year's photo looks like.
                </div>
              )}

              {upcomingViewHabits.length > 0 && (
                <div style={S.card}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    onClick={() => setShowUpcoming((v) => !v)}
                  >
                    <div style={S.habitName}>🔒 Coming soon ({upcomingViewHabits.length})</div>
                    <span>{showUpcoming ? "▲" : "▼"}</span>
                  </div>
                  {showUpcoming && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                      {upcomingViewHabits.map((h) => (
                        <div key={h.id} style={S.upcomingRow}>
                          <span>🔒 {h.name}</span>
                          <span style={S.minText}>Phase {h.phase ?? 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* WEEK PLAN */}
          <div style={S.swipePanel}>
            <div style={S.section}>
              <div style={{ ...S.card, borderLeft: "4px solid #FF6A2B" }}>
                <div style={S.habitName}>Current phase: {data.currentPhase}/3</div>
                <div style={{ ...S.minText, marginTop: 4 }}>
                  Switch phases to unlock more habits as you're ready. Habits in future phases stay in the "Coming soon" list on Today and don't count toward the weekly score.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      onClick={() => persist({ ...data, currentPhase: p })}
                      style={{
                        ...S.dayChip,
                        background: data.currentPhase === p ? "#FF6A2B" : "transparent",
                        color: data.currentPhase === p ? "#0C1526" : "#F2F0E9",
                        borderColor: data.currentPhase === p ? "#FF6A2B" : "#33456B",
                      }}
                    >
                      Phase {p}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ ...S.card, borderLeft: "4px solid #FF6A2B" }}>
                <div style={S.habitName}>Rollout phases</div>
                <div style={{ ...S.minText, marginTop: 4 }}>
                  Phase 1: workouts + protein + veggies + creatine. Phase 2: + guitar and meal prep, laundry, cleanup. Phase 3: + strict social media rule. Not all at once — otherwise everything breaks.
                </div>
              </div>
              {WEEK_PLAN.map((d, i) => (
                <div key={i} style={S.card}>
                  <div style={{ ...S.habitName, color: "#FF6A2B" }}>{d.day}</div>
                  {d.items.map((it, j) => (
                    <div key={j} style={{ ...S.minText, marginTop: 6, color: "#C9CFDB" }}>
                      {it}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* HABITS */}
          <div style={S.swipePanel}>
            <div style={S.section}>
              {habitForm && (
                <div style={{ ...S.card, borderLeft: "4px solid #FF6A2B" }}>
                  <div style={S.habitName}>{habitForm.id ? "Edit habit" : "New habit"}</div>
                  <input
                    value={habitForm.name}
                    onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                    placeholder="Habit name"
                    style={{ ...S.input, width: "100%", marginTop: 10 }}
                  />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {DAY_ORDER.map((day) => (
                      <button
                        key={day}
                        onClick={() => toggleFormDay(day)}
                        style={{
                          ...S.dayChip,
                          background: habitForm.days.includes(day) ? "#FF6A2B" : "transparent",
                          color: habitForm.days.includes(day) ? "#0C1526" : "#F2F0E9",
                          borderColor: habitForm.days.includes(day) ? "#FF6A2B" : "#33456B",
                        }}
                      >
                        {DAYS[day]}
                      </button>
                    ))}
                  </div>
                  <input
                    value={habitForm.min}
                    onChange={(e) => setHabitForm({ ...habitForm, min: e.target.value })}
                    placeholder="Minimum version (fallback text)"
                    style={{ ...S.input, width: "100%", marginTop: 10 }}
                  />
                  <div style={{ ...S.minText, marginTop: 10 }}>Phase</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {[1, 2, 3].map((p) => (
                      <button
                        key={p}
                        onClick={() => setHabitForm({ ...habitForm, phase: p })}
                        style={{
                          ...S.dayChip,
                          background: habitForm.phase === p ? "#FF6A2B" : "transparent",
                          color: habitForm.phase === p ? "#0C1526" : "#F2F0E9",
                          borderColor: habitForm.phase === p ? "#FF6A2B" : "#33456B",
                        }}
                      >
                        Phase {p}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button style={S.btn} onClick={saveHabitForm}>
                      {habitForm.id ? "Save" : "Create"}
                    </button>
                    <button style={S.btnGhost} onClick={closeHabitForm}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {!habitForm && (
                <button style={S.btn} onClick={() => openNewHabit()}>
                  + New habit
                </button>
              )}
              {data.habits.map((h) => (
                <div key={h.id} style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={S.habitName}>{h.name}</div>
                    <span style={S.phaseTag}>Phase {h.phase ?? 1}</span>
                  </div>
                  <div style={{ ...S.minText, marginTop: 4 }}>
                    Days: {DAY_ORDER.filter((d) => h.days.includes(d)).map((d) => DAYS[d]).join(", ") || "—"}
                  </div>
                  {h.min && <div style={S.minText}>Minimum: {h.min}</div>}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button style={S.btnSmall} onClick={() => openEditHabit(h)}>
                      Edit
                    </button>
                    <button style={{ ...S.btnSmall, background: "#3A2530" }} onClick={() => deleteHabit(h.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IDEAS */}
          <div style={S.swipePanel}>
            <div style={S.section}>
              <div style={S.card}>
                <div style={S.habitName}>System backlog</div>
                <div style={S.minText}>
                  New habit ideas and things to drop go here. Roll out one at a time, no sooner than 2 weeks after the previous one.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder="e.g. sleep by 11:30pm"
                    style={S.input}
                  />
                  <button
                    style={S.btn}
                    onClick={() => {
                      if (!ideaText.trim()) return;
                      persist({ ...data, ideas: [{ id: Date.now(), text: ideaText.trim(), done: false }, ...data.ideas] });
                      setIdeaText("");
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              {data.ideas.map((it) => (
                <div key={it.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ textDecoration: it.done ? "line-through" : "none", opacity: it.done ? 0.5 : 1 }}>
                    {it.text}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...S.btnSmall, background: "#FF6A2B", color: "#0C1526" }} onClick={() => convertIdeaToHabit(it)}>
                      → Habit
                    </button>
                    <button
                      style={S.btnSmall}
                      onClick={() =>
                        persist({ ...data, ideas: data.ideas.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)) })
                      }
                    >
                      {it.done ? "↺" : "✓"}
                    </button>
                    <button
                      style={{ ...S.btnSmall, background: "#3A2530" }}
                      onClick={() => persist({ ...data, ideas: data.ideas.filter((x) => x.id !== it.id) })}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {data.ideas.length === 0 && <div style={S.card}>Empty. That first idea is already in your head — write it down.</div>}
            </div>
          </div>

          {/* RULES */}
          <div style={S.swipePanel}>
            <div style={S.section}>
              {[
                ["Minimum rule", "Skipping isn't allowed. But a minimal version (5 minutes) is fine — the streak holds. This kills all-or-nothing thinking."],
                ["Weekly reward", "≥80% for the week — sweets on Sunday, enjoyed mindfully. A treat is a trophy, not background noise."],
                ["Missing a day", "One miss is a fluke (a yellow mark doesn't break the streak). Two in a row is a signal: simplify the habit, don't punish yourself."],
                ["Money", "On every payday: 30% auto-transferred (10% apartment / 10% car / 10% travel). Pay yourself first, spend after."],
                ["Social media", "Opens only after the day's tasks are done. Removed from the home screen. It's a reward built into the system, not a leak."],
                ["Food", "Not 'eat less' but '25–30 g of protein per meal.' Don't skip dinner — keep it light and protein-based."],
              ].map(([t, txt], i) => (
                <div key={i} style={S.card}>
                  <div style={S.habitName}>{t}</div>
                  <div style={{ ...S.minText, marginTop: 4 }}>{txt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- styles ----------
const S = {
  app: {
    minHeight: "100vh",
    background: "#0C1526",
    color: "#F2F0E9",
    fontFamily: "'Manrope', sans-serif",
    padding: "16px 0 60px",
    maxWidth: 520,
    margin: "0 auto",
    overflowX: "hidden",
  },
  board: {
    background: "#101D33",
    border: "1px solid #22355A",
    borderRadius: 14,
    padding: "16px 16px 14px",
    margin: "0 14px",
  },
  boardTop: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  eyebrow: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 12,
    letterSpacing: "0.18em",
    color: "#8A93A6",
  },
  scoreRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  teamCol: { textAlign: "center", flex: 1 },
  teamName: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 13,
    letterSpacing: "0.12em",
    color: "#FF6A2B",
  },
  bigScore: {
    fontFamily: "'Oswald', sans-serif",
    fontWeight: 700,
    fontSize: 56,
    lineHeight: 1.05,
  },
  vs: { textAlign: "center", flex: 1 },
  pct: { fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 24, color: "#D9A441" },
  pctLabel: { fontSize: 11, color: "#8A93A6" },
  streakRow: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" },
  streakChip: {
    background: "#1C2A44",
    borderRadius: 20,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 600,
  },
  ticksRow: { display: "flex", justifyContent: "space-between", marginTop: 14 },
  tickCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  tick: { width: 26, height: 26, borderRadius: 6 },
  tickLabel: { fontSize: 11, color: "#8A93A6" },
  tabs: { display: "flex", gap: 6, margin: "16px 14px 12px" },
  tab: {
    flex: 1,
    background: "transparent",
    border: "1px solid #22355A",
    color: "#8A93A6",
    borderRadius: 10,
    padding: "9px 4px",
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: "0.06em",
    fontSize: 13,
  },
  tabActive: { background: "#FF6A2B", borderColor: "#FF6A2B", color: "#0C1526", fontWeight: 700 },
  swipeViewport: { overflow: "hidden", touchAction: "pan-y" },
  swipeTrack: { display: "flex", width: "100%" },
  swipePanel: { flex: "0 0 100%", width: "100%", padding: "0 14px", boxSizing: "border-box" },
  section: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    background: "#101D33",
    border: "1px solid #22355A",
    borderRadius: 12,
    padding: "14px 14px",
    fontSize: 14.5,
    lineHeight: 1.45,
  },
  habitName: { fontWeight: 800, fontSize: 15.5 },
  minText: { color: "#8A93A6", fontSize: 13, marginTop: 3 },
  btn: {
    background: "#FF6A2B",
    color: "#0C1526",
    border: "none",
    borderRadius: 9,
    padding: "9px 16px",
    fontWeight: 800,
    fontFamily: "'Manrope', sans-serif",
    fontSize: 14,
  },
  btnGhost: {
    background: "transparent",
    color: "#F2F0E9",
    border: "1px solid #33456B",
    borderRadius: 9,
    padding: "9px 16px",
    fontWeight: 600,
    fontSize: 14,
  },
  dayChip: {
    border: "1px solid #33456B",
    borderRadius: 20,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 700,
  },
  btnSmall: {
    background: "#22355A",
    color: "#F2F0E9",
    border: "none",
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 14,
  },
  input: {
    flex: 1,
    background: "#0C1526",
    border: "1px solid #33456B",
    borderRadius: 9,
    color: "#F2F0E9",
    padding: "9px 12px",
    fontSize: 14,
    fontFamily: "'Manrope', sans-serif",
  },
  dayNavRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  dayNavBtn: {
    background: "#22355A",
    color: "#F2F0E9",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 16,
    fontWeight: 700,
  },
  dayNavLabel: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 14,
    letterSpacing: "0.04em",
    color: "#F2F0E9",
  },
  editingBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#3A2E10",
    border: "1px solid #D9A441",
    color: "#D9A441",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 700,
  },
  infoIcon: { color: "#8A93A6", fontSize: 14, marginLeft: 8 },
  veggieDetail: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #22355A",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  veggieStep: {
    background: "#0C1526",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    color: "#C9CFDB",
  },
  upcomingRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13.5,
    color: "#C9CFDB",
  },
  phaseTag: {
    fontSize: 11,
    color: "#8A93A6",
    border: "1px solid #33456B",
    borderRadius: 20,
    padding: "3px 8px",
    whiteSpace: "nowrap",
  },
};
