import { useState, useEffect } from "react";

// ---------- helpers ----------
const DAYS_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
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

const DEFAULT_HABITS = [
  { id: "h1", name: "Силовая в зале", days: [6, 0], min: "20 мин: присед + тяга + негативные подтягивания" },
  { id: "h2", name: "Мини-сессия дома (баланс + техника + кор)", days: [1, 2, 3, 4, 5], min: "5 мин: планка + баланс на одной ноге" },
  { id: "h3", name: "Белок 3 раза по 25–30 г", days: [0, 1, 2, 3, 4, 5, 6], min: "Хотя бы 2 приёма с белком" },
  { id: "h4", name: "Овощ дня (микропорция)", days: [0, 1, 2, 3, 4, 5, 6], min: "1 ложка / 2 кусочка — попробовать" },
  { id: "h5", name: "Соцсети — только после задач дня", days: [1, 2, 3, 4, 5], min: "Не открывать до обеда" },
  { id: "h6", name: "Гитара 15 мин (со 2-й фазы)", days: [0, 1, 2, 3, 4], min: "5 мин: один аккордовый переход / один рифф" },
  { id: "h7", name: "Заказ продуктов к meal prep", days: [5], min: "Заказать хотя бы курицу + творог + крупу" },
  { id: "h8", name: "Стирка", days: [3, 0], min: "Закинуть машинку = выполнено" },
  { id: "h9", name: "Уборка 20 мин по таймеру", days: [6], min: "10 мин только кухня" },
  { id: "h10", name: "Креатин 5 г", days: [0, 1, 2, 3, 4, 5, 6], min: "—" },
];

const WEEK_PLAN = [
  {
    day: "Питание (каждый день)",
    items: [
      "Утро: капучино + творог 200 г с фруктом (из баночки, 5 мин) ≈ 33 г белка",
      "Обед: контейнер — курица в соевом 150 г + гречка/рис 150 г + овощи из аэрогриля ≈ 40 г белка",
      "Ужин: контейнер — курица 120–130 г + гарнир ≈ 33 г белка",
      "Протеин: 1 скуп после тренировки (в дни тренировок)",
      "Креатин: 5 г каждый день, + 0.5 л воды. Первые 2 недели +0.5–1 кг воды — это норма",
      "Сладкое — трофей воскресенья при ≥80%",
    ],
  },
  {
    day: "Понедельник · Баланс + кор (15–20 мин, отдых 30 сек)",
    items: [
      "Баланс на одной ноге 3×30 сек/нога (нед. 3+: глаза закрыты; нед. 6+: на подушке)",
      "Планка 3×40 сек · Ягодичный мост 3×15 · Чеканка/ведение мяча 5 мин",
      "Гитара 15 мин → потом соцсети",
    ],
  },
  {
    day: "Вторник · Техника бега",
    items: [
      "Скакалка 4×1 мин — приземление на переднюю часть стопы, мягко (отдых 45 сек)",
      "Высокое бедро на месте 3×20 сек · «Стенка» 45°: вынос бедра 3×10/нога",
      "Гитара 15 мин",
    ],
  },
  {
    day: "Среда · Кор + мобильность",
    items: [
      "Боковая планка 3×30 сек/сторона · Dead bug 3×10",
      "Растяжка бёдер, ягодиц, голеностопа 7–8 мин",
      "Стирка · Гитара 15 мин",
    ],
  },
  {
    day: "Четверг · Взрывная база",
    items: [
      "Прыжки из полуприседа 3×8, мягкое приземление (отдых 60 сек!)",
      "Приставные шаги в полуприседе 3×20 сек · Выпрыгивания на одной ноге через линию 3×10/нога · Чеканка 5 мин",
      "Гитара 15 мин",
    ],
  },
  {
    day: "Пятница · Отдых",
    items: ["Заказ продуктов (10 мин) · Прогулка · Ранний сон — завтра зал"],
  },
  {
    day: "Суббота 9:00 · Силовая A — Кинезис (~50 мин)",
    items: [
      "Разминка 5 мин: скакалка + суставы",
      "Присед с кабелями у груди 4×8 (отдых 90 сек) · Румынская тяга с нижних кабелей 3×10 (90 сек)",
      "Тяга сверху узким хватом 4×8 (60 сек) · НЕГАТИВНЫЕ подтягивания 4×3, опускание 5 сек (90 сек)",
      "Pallof press 3×10/сторона (30 сек) · Растяжка 3 мин",
      "Днём: meal prep 1.5 ч (курица 2 кг в соевом + овощи в аэрогриль, крупа 700 г, творог по баночкам ×5, 10 контейнеров) · Уборка 20 мин",
    ],
  },
  {
    day: "Воскресенье 9:00 · Силовая B — Кинезис (~50 мин)",
    items: [
      "Разминка 5 мин",
      "Тяга одной рукой в наклоне 4×8/рука (60 сек) · Жим кабелей от груди СТОЯ 3×10 (90 сек)",
      "Выпады назад с кабелями 3×10/нога (60 сек) · Жим одной рукой вверх 3×8/рука (60 сек)",
      "Подъём на носки на одной ноге 3×12/нога (30 сек) · Боковая планка 3×30 сек/сторона",
      "Стирка · Вечером: гитара + награда 🍫 при ≥80%",
      "Прогрессия везде: все подходы чисто → +вес или +1 повтор",
    ],
  },
];

const VEGGIE_LADDER = [
  "Уровень 1 — Спрятанные: морковь в плове, томат в соусе, тыквенный крем-суп",
  "Уровень 2 — Запечённые с приправами: картофель + морковь + паприка, кабачок-гриль",
  "Уровень 3 — В составе блюда, но видимые: овощи в лагмане, болгарский перец в жарком",
  "Уровень 4 — Отдельный гарнир: запечённая брокколи с сыром, стручковая фасоль с чесноком",
  "Уровень 5 — Свежие: огурец с солью, черри, морковные палочки с хумусом",
];

const STORAGE_KEY = "gt-data-v1";
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Пн..Вс
const emptyHabitForm = { id: null, name: "", days: [], min: "" };

export default function GulnurTracker() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("today");
  const [ideaText, setIdeaText] = useState("");
  const [saveState, setSaveState] = useState("");
  const [habitForm, setHabitForm] = useState(null); // null = closed, else emptyHabitForm-shaped

  // ---------- load ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw);
      const ids = new Set(parsed.habits.map((h) => h.id));
      const merged = [...parsed.habits, ...DEFAULT_HABITS.filter((h) => !ids.has(h.id))];
      setData({ ...parsed, habits: merged });
    } catch {
      setData({
        habits: DEFAULT_HABITS,
        log: {},
        ideas: [],
        veggieLevel: 1,
        startDate: todayISO(),
      });
    }
  }, []);

  const persist = (next) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveState("Сохранено");
      setTimeout(() => setSaveState(""), 1200);
    } catch {
      setSaveState("Ошибка сохранения");
    }
  };

  if (!data)
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#F2F0E9", fontFamily: "sans-serif" }}>Загрузка…</div>
      </div>
    );

  // ---------- computations ----------
  const now = new Date();
  const tISO = todayISO(now);
  const weekStart = startOfWeek(now);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const habitsForDate = (d) => data.habits.filter((h) => h.days.includes(d.getDay()));

  const dayScore = (d) => {
    const iso = todayISO(d);
    const hs = habitsForDate(d);
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
    for (const d of weekDates) planned += habitsForDate(d).length;
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

  const toggle = (habitId, mode) => {
    const log = { ...data.log };
    const day = { ...(log[tISO] || {}) };
    day[habitId] = day[habitId] === mode ? null : mode;
    if (!day[habitId]) delete day[habitId];
    log[tISO] = day;
    persist({ ...data, log });
  };

  const openNewHabit = (prefillName = "") => setHabitForm({ ...emptyHabitForm, name: prefillName });
  const openEditHabit = (h) => setHabitForm({ id: h.id, name: h.name, days: [...h.days], min: h.min });
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
      persist({ ...data, habits: [...data.habits, { id: `h${Date.now()}`, name: clean.name, days: clean.days, min: clean.min }] });
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

  const todayHabits = habitsForDate(now);
  const todayDone = todayHabits.filter((h) => data.log[tISO]?.[h.id]).length;

  const rewardUnlocked = weekStats.pct >= 80;
  const missedToday = todayHabits.length - todayDone;

  // ---------- UI ----------
  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Manrope:wght@400;600;800&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      {/* SCOREBOARD */}
      <div style={S.board}>
        <div style={S.boardTop}>
          <span style={S.eyebrow}>МАТЧ НЕДЕЛИ</span>
          <span style={{ ...S.eyebrow, color: "#FF6A2B" }}>{saveState}</span>
        </div>
        <div style={S.scoreRow}>
          <div style={S.teamCol}>
            <div style={S.teamName}>ГУЛЬНУР</div>
            <div style={S.bigScore}>{weekStats.done}</div>
          </div>
          <div style={S.vs}>
            <div style={S.pct}>{weekStats.pct}%</div>
            <div style={S.pctLabel}>из {weekStats.planned} задач</div>
          </div>
          <div style={S.teamCol}>
            <div style={{ ...S.teamName, color: "#8A93A6" }}>ВЧЕРАШНЯЯ Я</div>
            <div style={{ ...S.bigScore, color: "#8A93A6" }}>
              {Math.max(0, weekStats.total - weekStats.done)}
            </div>
          </div>
        </div>
        <div style={S.streakRow}>
          <span style={S.streakChip}>🔥 Серия: {streak} {streak === 1 ? "день" : streak < 5 ? "дня" : "дней"}</span>
          <span style={{ ...S.streakChip, background: rewardUnlocked ? "#2E7D4F" : "#1C2A44" }}>
            {rewardUnlocked ? "🍫 Награда открыта" : `До награды: ${80 - weekStats.pct > 0 ? 80 - weekStats.pct : 0}%`}
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
                <span style={S.tickLabel}>{DAYS_RU[d.getDay()]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        {[
          ["today", "Сегодня"],
          ["plan", "План"],
          ["habits", "Привычки"],
          ["veggie", "Овощи"],
          ["ideas", "Идеи"],
          ["rules", "Правила"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{ ...S.tab, ...(tab === k ? S.tabActive : {}) }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TODAY */}
      {tab === "today" && (
        <div style={S.section}>
          {todayHabits.length === 0 && (
            <div style={S.card}>Сегодня день восстановления — задач нет. Серия не ломается.</div>
          )}
          {todayHabits.map((h) => {
            const state = data.log[tISO]?.[h.id];
            return (
              <div key={h.id} style={{ ...S.card, opacity: state ? 0.75 : 1 }}>
                <div style={S.habitName}>
                  {state === "full" ? "✅ " : state === "min" ? "🟡 " : ""}
                  {h.name}
                </div>
                <div style={S.minText}>Минимум: {h.min}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => toggle(h.id, "full")}
                    style={{ ...S.btn, background: state === "full" ? "#FF6A2B" : "#22355A" }}
                  >
                    Сделано
                  </button>
                  <button
                    onClick={() => toggle(h.id, "min")}
                    style={{ ...S.btnGhost, borderColor: state === "min" ? "#D9A441" : "#33456B" }}
                  >
                    Минимум
                  </button>
                </div>
              </div>
            );
          })}
          {missedToday === 0 && todayHabits.length > 0 && (
            <div style={{ ...S.card, background: "#173325", border: "1px solid #2E7D4F" }}>
              Полный день. Так выглядит человек, который через год не узнает себя на фото.
            </div>
          )}
        </div>
      )}

      {/* WEEK PLAN */}
      {tab === "plan" && (
        <div style={S.section}>
          <div style={{ ...S.card, borderLeft: "4px solid #FF6A2B" }}>
            <div style={S.habitName}>Фазы внедрения</div>
            <div style={{ ...S.minText, marginTop: 4 }}>
              Недели 1–2: тренировки + белок + овощ. Недели 3–4: + гитара и meal prep. Неделя 5+: + правило соцсетей строго. Не всё сразу — иначе сломается всё.
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
      )}

      {/* HABITS */}
      {tab === "habits" && (
        <div style={S.section}>
          {habitForm && (
            <div style={{ ...S.card, borderLeft: "4px solid #FF6A2B" }}>
              <div style={S.habitName}>{habitForm.id ? "Редактировать привычку" : "Новая привычка"}</div>
              <input
                value={habitForm.name}
                onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                placeholder="Название привычки"
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
                    {DAYS_RU[day]}
                  </button>
                ))}
              </div>
              <input
                value={habitForm.min}
                onChange={(e) => setHabitForm({ ...habitForm, min: e.target.value })}
                placeholder="Минимальная версия (текст минимума)"
                style={{ ...S.input, width: "100%", marginTop: 10 }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button style={S.btn} onClick={saveHabitForm}>
                  {habitForm.id ? "Сохранить" : "Создать"}
                </button>
                <button style={S.btnGhost} onClick={closeHabitForm}>
                  Отмена
                </button>
              </div>
            </div>
          )}
          {!habitForm && (
            <button style={S.btn} onClick={() => openNewHabit()}>
              + Новая привычка
            </button>
          )}
          {data.habits.map((h) => (
            <div key={h.id} style={S.card}>
              <div style={S.habitName}>{h.name}</div>
              <div style={{ ...S.minText, marginTop: 4 }}>
                Дни: {DAY_ORDER.filter((d) => h.days.includes(d)).map((d) => DAYS_RU[d]).join(", ") || "—"}
              </div>
              {h.min && <div style={S.minText}>Минимум: {h.min}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={S.btnSmall} onClick={() => openEditHabit(h)}>
                  Редактировать
                </button>
                <button style={{ ...S.btnSmall, background: "#3A2530" }} onClick={() => deleteHabit(h.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VEGGIE */}
      {tab === "veggie" && (
        <div style={S.section}>
          <div style={S.card}>
            <div style={S.habitName}>Лестница овощей — уровень {data.veggieLevel} из 5</div>
            <div style={{ ...S.minText, marginTop: 6 }}>
              Правило: микропорция каждый день. Один и тот же овощ 8–10 раз, потом решаешь — оставить или заменить.
              На следующий уровень — когда текущий перестал вызывать сопротивление (обычно 2–3 недели).
            </div>
          </div>
          {VEGGIE_LADDER.map((v, i) => (
            <div
              key={i}
              style={{
                ...S.card,
                borderLeft: `4px solid ${i + 1 < data.veggieLevel ? "#2E7D4F" : i + 1 === data.veggieLevel ? "#FF6A2B" : "#33456B"}`,
                opacity: i + 1 > data.veggieLevel ? 0.55 : 1,
              }}
            >
              {v}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={S.btn}
              onClick={() => persist({ ...data, veggieLevel: Math.min(5, data.veggieLevel + 1) })}
            >
              Уровень пройден →
            </button>
            <button
              style={S.btnGhost}
              onClick={() => persist({ ...data, veggieLevel: Math.max(1, data.veggieLevel - 1) })}
            >
              ← Назад
            </button>
          </div>
        </div>
      )}

      {/* IDEAS */}
      {tab === "ideas" && (
        <div style={S.section}>
          <div style={S.card}>
            <div style={S.habitName}>Бэклог системы</div>
            <div style={S.minText}>
              Сюда — идеи новых привычек и что убрать. Внедряем по одной, не раньше чем через 2 недели после предыдущей.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="Например: сон до 23:30"
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
                  → Привычка
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
          {data.ideas.length === 0 && <div style={S.card}>Пусто. Первая идея уже крутится в голове — запиши её.</div>}
        </div>
      )}

      {/* RULES */}
      {tab === "rules" && (
        <div style={S.section}>
          {[
            ["Правило минимума", "Пропустить нельзя. Но можно сделать минимальную версию (5 минут) — серия сохраняется. Это убивает «всё или ничего»."],
            ["Награда недели", "≥80% за неделю — сладкое в воскресенье, осознанно и с удовольствием. Шоколадка — трофей, а не фон."],
            ["Пропуск", "Один пропуск — случайность (жёлтая метка не ломает серию). Два подряд — сигнал: упрости привычку, а не наказывай себя."],
            ["Деньги", "В день каждого поступления: 30% автопереводом (10% квартира / 10% машина / 10% путешествия). Сначала себе — потом тратить."],
            ["Соцсети", "Открываются только после закрытия задач дня. Убраны с главного экрана. Это награда в системе, а не утечка."],
            ["Еда", "Не «есть меньше», а «25–30 г белка в каждом приёме». Ужин не пропускать — лёгкий белковый."],
          ].map(([t, txt], i) => (
            <div key={i} style={S.card}>
              <div style={S.habitName}>{t}</div>
              <div style={{ ...S.minText, marginTop: 4 }}>{txt}</div>
            </div>
          ))}
        </div>
      )}
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
    padding: "16px 14px 60px",
    maxWidth: 520,
    margin: "0 auto",
  },
  board: {
    background: "#101D33",
    border: "1px solid #22355A",
    borderRadius: 14,
    padding: "16px 16px 14px",
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
  tabs: { display: "flex", gap: 6, margin: "16px 0 12px" },
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
};
