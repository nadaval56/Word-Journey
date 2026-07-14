/**
 * data-loader.js — טעינה, נרמול וסינון של מאגר המילים.
 *
 * המאגר הוא קובץ JSON סטטי (data/words.json) — ראו README על מבנה ערך
 * ועל כללי תיוג הוודאות.
 */

let cache = null;

/** טוען את המאגר (פעם אחת) ומחזיר אובייקט { meta, words, cognates }. */
export async function loadData() {
  if (cache) return cache;
  const res = await fetch('data/words.json');
  if (!res.ok) throw new Error(`Failed to load dataset: HTTP ${res.status}`);
  const data = await res.json();
  data.words.forEach(normalizeWord);
  // מיון אלפביתי לפי המילה העברית (לפי אותיות הבסיס, בהתעלם מניקוד)
  data.words.sort((a, b) => hebrewSortKey(a.hebrew).localeCompare(hebrewSortKey(b.hebrew), 'he'));
  cache = data;
  return data;
}

/** מפתח מיון: מסיר ניקוד, טעמים, מקף ורווחים — כדי למיין לפי אותיות הבסיס בלבד. */
function hebrewSortKey(s) {
  return s.normalize('NFC').replace(/[֑-ׇ]/g, '').replace(/\s/g, '');
}

/** מוסיף שדות נגזרים למילה: תחנות יעד סופיות ורשימת מנגנונים בפועל. */
function normalizeWord(word) {
  // התחנה האחרונה של כל מסלול = "הצורה הסופית" (משמשת לרשימה ולמשחק)
  word.finalStations = word.journeys.map((j) => j.path[j.path.length - 1]);
  // מנגנון יכול להיות שונה בין מסלולים (למשל שבת) — אוספים את כולם
  const set = new Set([word.mechanism]);
  word.journeys.forEach((j) => { if (j.mechanism) set.add(j.mechanism); });
  word.allMechanisms = [...set];
}

/** כל שפות היעד הקיימות במאגר (לרשימת הסינון), ממוינות לפי א"ב. */
export function collectTargetLangs(words) {
  const langs = new Set();
  words.forEach((w) => w.finalStations.forEach((s) => langs.add(s.lang)));
  return [...langs].sort((a, b) => a.localeCompare(b, 'he'));
}

/**
 * סינון וחיפוש.
 * @param {Array} words - המאגר
 * @param {Object} f - { query, mechanism, certainty, lang }
 */
export function filterWords(words, f) {
  const q = (f.query || '').trim().toLowerCase();
  return words.filter((w) => {
    if (f.mechanism && !w.allMechanisms.includes(f.mechanism)) return false;
    if (f.certainty && w.certainty !== f.certainty) return false;
    if (f.lang && !w.finalStations.some((s) => s.lang === f.lang)) return false;
    if (q) {
      const haystack = [
        w.hebrew, w.translit, w.meaning,
        ...w.journeys.flatMap((j) => j.path.flatMap((s) => [s.form, s.translit, s.lang, s.meaning])),
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** מחזיר מילה לפי מזהה. */
export function getWord(data, id) {
  return data.words.find((w) => w.id === id) || null;
}
