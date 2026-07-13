/**
 * game.js — מצב בלש (Reverse Guess) + אתגר "הַשְׁאָלה או בני־דודים".
 *
 * שני סוגי שאלות:
 *  1. guess — מוצגת צורה סופית לועזית, והתלמיד מנחש מאיזו מילה עברית באה
 *     (בחירה מרובה). אחרי תשובה: חשיפת המסע המלא צעד־צעד.
 *  2. pair  — מוצג זוג (עברית + מילה בשפה אחרת) והתלמיד מכריע:
 *     מסע הַשְׁאָלה או בני־דודים (קוגנטים)? מאמן את הבחנת הליבה של הכלי.
 *
 * ניקוד ורצף נשמרים ב-localStorage בלבד (מגבלה טכנית סעיף 9).
 */

import { renderJourneyStrip, certaintyBadge } from './journey-view.js';

const STORAGE_KEY = 'word-journey:game:v1';
const POINTS_PER_CORRECT = 10;
const PAIR_QUESTION_RATIO = 0.3; // כ־30% מהשאלות הן אתגר השאלה/קוגנט

let data = null;
let container = null;
let stats = null;
let current = null; // השאלה הנוכחית

/* ---------- שמירת מצב ---------- */

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* localStorage חסום או JSON פגום — מתחילים מאפס */ }
  return { score: 0, streak: 0, bestStreak: 0, answered: 0, correct: 0 };
}

function saveStats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch { /* מצב פרטי וכד' — המשחק ממשיך בלי שמירה */ }
}

/* ---------- כלי עזר ---------- */

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** מילים כשרות לחידון הניחוש: מסע אמיתי בלבד — בלי עממי ובלי שנוי במחלוקת. */
function quizzableWords() {
  return data.words.filter((w) => w.certainty === 'documented' || w.certainty === 'probable');
}

/* ---------- בניית שאלות ---------- */

function makeGuessQuestion() {
  const pool = quizzableWords();
  const word = pick(pool);
  const journey = pick(word.journeys);
  const final = journey.path[journey.path.length - 1];

  // מסיחים: מילים עבריות אחרות מהמאגר
  const distractors = shuffle(pool.filter((w) => w.id !== word.id))
    .slice(0, 3)
    .map((w) => ({ label: w.hebrew, correct: false }));

  return {
    type: 'guess',
    word,
    journey,
    final,
    options: shuffle([{ label: word.hebrew, correct: true }, ...distractors]),
  };
}

function makePairQuestion() {
  // חצי מהמקרים: קוגנט אמיתי; חצי: הַשְׁאָלה אמיתית — התלמיד מכריע
  const useCognate = Math.random() < 0.5;

  if (useCognate) {
    const cog = pick(data.cognates);
    return {
      type: 'pair',
      isBorrowing: false,
      hebrew: cog.hebrew,
      other: cog.other,
      explanation: `${cog.explanation}`,
      extra: cog.root,
      sources: cog.sources,
    };
  }

  // הַשְׁאָלה אמיתית: מילה מתועדת + התחנה הסופית של אחד ממסלוליה
  const pool = quizzableWords().filter((w) => w.certainty === 'documented');
  const word = pick(pool);
  const journey = pick(word.journeys);
  const final = journey.path[journey.path.length - 1];
  return {
    type: 'pair',
    isBorrowing: true,
    hebrew: word.hebrew,
    other: { lang: final.lang, form: final.form, translit: final.translit, meaning: final.meaning },
    explanation: `זהו מסע הַשְׁאָלה מתועד: המילה עברה מדובר לדובר${journey.path.length > 2 ? `, דרך ${journey.path.slice(1, -1).map((s) => s.lang).join(' ו')}` : ''} — יש לה שרשרת תחנות, לא אב קדמון משותף.`,
    word,
    journey,
  };
}

function nextQuestion() {
  current = Math.random() < PAIR_QUESTION_RATIO ? makePairQuestion() : makeGuessQuestion();
  renderQuestion();
}

/* ---------- רינדור ---------- */

function renderHeader() {
  const acc = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
  return `
    <div class="game-header">
      <h2 style="margin:0">🕵️ מצב בלש</h2>
      <div class="game-scores">
        <span class="score-chip">ניקוד <span class="val">${stats.score}</span></span>
        <span class="score-chip">🔥 רצף <span class="val">${stats.streak}</span></span>
        <span class="score-chip">שיא רצף <span class="val">${stats.bestStreak}</span></span>
        <span class="score-chip">דיוק <span class="val">${acc}%</span></span>
      </div>
    </div>`;
}

function renderQuestion() {
  container.innerHTML = renderHeader();
  const card = document.createElement('div');
  card.className = 'game-card';

  if (current.type === 'guess') {
    card.innerHTML = `
      <p class="game-kicker">מילת מסתורין ב${esc(current.final.lang)}:</p>
      <p class="game-mystery"><bdi>${esc(current.final.form)}</bdi></p>
      <p class="game-hint">משמעות: ${esc(current.final.meaning || '—')}</p>
      <p><strong>מאיזו מילה עברית היא הגיעה?</strong></p>
      <div class="game-options"></div>`;
    const optionsBox = card.querySelector('.game-options');
    current.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'game-option';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => answerGuess(opt, btn));
      optionsBox.appendChild(btn);
    });
  } else {
    card.innerHTML = `
      <p class="game-kicker">שתי מילים דומות. מה הסיפור שלהן?</p>
      <p class="game-mystery">${esc(current.hebrew)} ⟷ <bdi>${esc(current.other.form)}</bdi></p>
      <p class="game-hint">${esc(current.other.lang)}: <bdi>${esc(current.other.translit || '')}</bdi> — ${esc(current.other.meaning || '')}</p>
      <p><strong>מסע הַשְׁאָלה — או בני־דודים מלידה?</strong></p>
      <div class="game-options">
        <button class="game-option" data-answer="borrowing">🧳 מסע הַשְׁאָלה</button>
        <button class="game-option" data-answer="cognate">👪 בני־דודים (קוגנטים)</button>
      </div>`;
    card.querySelectorAll('.game-option').forEach((btn) => {
      btn.addEventListener('click', () => answerPair(btn));
    });
  }

  container.appendChild(card);
}

/* ---------- טיפול בתשובות ---------- */

function applyScore(correct) {
  stats.answered += 1;
  if (correct) {
    stats.correct += 1;
    stats.streak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
    // בונוס רצף קטן: כל תשובה ברצף שווה יותר
    stats.score += POINTS_PER_CORRECT + Math.min(stats.streak - 1, 5) * 2;
  } else {
    stats.streak = 0;
  }
  saveStats();
}

function answerGuess(opt, clickedBtn) {
  const card = container.querySelector('.game-card');
  card.querySelectorAll('.game-option').forEach((b) => {
    b.disabled = true;
    if (b.textContent === current.word.hebrew) b.classList.add('correct');
  });
  if (!opt.correct) clickedBtn.classList.add('wrong');
  applyScore(opt.correct);

  const feedback = document.createElement('p');
  feedback.className = `game-feedback ${opt.correct ? 'good' : 'bad'}`;
  feedback.textContent = opt.correct
    ? `🎯 בדיוק! ${current.final.form} היא ${current.word.hebrew}`
    : `לא הפעם — ${current.final.form} היא בעצם ${current.word.hebrew} (${current.word.meaning})`;
  card.appendChild(feedback);

  // חשיפת המסע צעד־צעד: מתחילים מהמקור וחושפים תחנה־תחנה
  const revealArea = document.createElement('div');
  revealArea.className = 'reveal-area';
  card.appendChild(revealArea);
  let revealed = 1;

  const actions = document.createElement('div');
  actions.className = 'game-actions';
  const revealBtn = document.createElement('button');
  revealBtn.className = 'btn btn-secondary';
  revealBtn.textContent = '🗺️ חשפו את המסע';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn';
  nextBtn.textContent = 'לשאלה הבאה ←';
  nextBtn.addEventListener('click', nextQuestion);
  actions.append(revealBtn, nextBtn);
  card.appendChild(actions);

  const drawReveal = () => {
    revealArea.innerHTML = `<h3 class="journey-title">${esc(current.journey.title || 'המסע')}</h3>`;
    revealArea.appendChild(renderJourneyStrip(current.journey, { revealCount: revealed }));
  };

  revealBtn.addEventListener('click', () => {
    if (revealBtn.dataset.started) {
      revealed += 1;
    } else {
      revealBtn.dataset.started = '1';
    }
    drawReveal();
    if (revealed >= current.journey.path.length) {
      revealBtn.remove();
    } else {
      revealBtn.textContent = 'התחנה הבאה ⟵';
    }
    // עדכון כותרת הניקוד אחרי התשובה
    container.querySelector('.game-header').outerHTML = renderHeader().trim();
  });

  // עדכון ניקוד מיידי בכותרת
  container.querySelector('.game-header').outerHTML = renderHeader().trim();
}

function answerPair(clickedBtn) {
  const card = container.querySelector('.game-card');
  const saidBorrowing = clickedBtn.dataset.answer === 'borrowing';
  const correct = saidBorrowing === current.isBorrowing;

  card.querySelectorAll('.game-option').forEach((b) => {
    b.disabled = true;
    const isRight = (b.dataset.answer === 'borrowing') === current.isBorrowing;
    if (isRight) b.classList.add('correct');
  });
  if (!correct) clickedBtn.classList.add('wrong');
  applyScore(correct);

  const feedback = document.createElement('p');
  feedback.className = `game-feedback ${correct ? 'good' : 'bad'}`;
  feedback.textContent = correct
    ? '🎯 הבחנה בלשית מדויקת!'
    : (current.isBorrowing ? 'דווקא מסע הַשְׁאָלה!' : 'דווקא בני־דודים — אין כאן מסע!');
  card.appendChild(feedback);

  const explain = document.createElement('div');
  explain.className = 'game-explain word-note';
  explain.innerHTML = `💡 ${esc(current.explanation)}${current.extra ? `<br><small>${esc(current.extra)}</small>` : ''}`;
  card.appendChild(explain);

  // אם זו הייתה הַשְׁאָלה אמיתית — אפשר להראות את המסע המלא
  if (current.isBorrowing && current.journey) {
    const revealArea = document.createElement('div');
    revealArea.className = 'reveal-area';
    revealArea.appendChild(renderJourneyStrip(current.journey));
    card.appendChild(revealArea);
  }

  const actions = document.createElement('div');
  actions.className = 'game-actions';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn';
  nextBtn.textContent = 'לשאלה הבאה ←';
  nextBtn.addEventListener('click', nextQuestion);
  actions.appendChild(nextBtn);
  card.appendChild(actions);

  container.querySelector('.game-header').outerHTML = renderHeader().trim();
}

/* ---------- API ---------- */

/** מפעיל את מצב הבלש בתוך המכל הנתון. */
export function initGame(gameContainer, loadedData) {
  container = gameContainer;
  data = loadedData;
  stats = loadStats();
  nextQuestion();
}
