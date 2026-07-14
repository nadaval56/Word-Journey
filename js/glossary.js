/**
 * glossary.js — מילון מונחים מוקפץ (pop-up).
 *
 * מטרה: להוריד "סינית" מהאתר. מונחים בלשניים/היסטוריים שאולי אינם מוכרים
 * לתלמיד (וולגטה, געז, רוטוולש, תרגום השבעים…) מסומנים אוטומטית בטקסט
 * המוצג, ולחיצה עליהם פותחת הסבר קצר — בלי לצאת לגוגל.
 *
 * שני חלקים:
 *   1. GLOSSARY — מילון המונחים (מפתח → הסבר קצר).
 *   2. annotate() — סורק צמתי טקסט באלמנט ועוטף מונחים מזוהים ב-<button>.
 *      פופאובר יחיד (בשיטת event delegation) מוצג ליד המונח שנלחץ.
 */

/* ---------- מילון המונחים ---------- */
/* term: המונח כפי שהוא מופיע בטקסט. aliases: צורות נוספות שמצביעות לאותו ערך. */
export const GLOSSARY = [
  { term: 'וולגטה', aliases: ['הוולגטה'], title: 'הוולגטה',
    def: 'תרגום המקרא ללטינית שערך הירונימוס במאה ה־4 לספירה. במשך יותר מאלף שנה זה היה נוסח המקרא הרשמי של הכנסייה הקתולית — ולכן דרכו זלגו מילים עבריות רבות ללטינית ולשפות אירופה.' },
  { term: 'תרגום השבעים', aliases: ['השבעים'], title: 'תרגום השבעים (ספטואגינטה)',
    def: 'התרגום היהודי הקדום של המקרא ליוונית, שנעשה באלכסנדריה החל מהמאה ה־3 לפנה"ס. השם בא מהאגדה על שבעים (או שבעים ושניים) הזקנים שתרגמו אותו. זו התחנה היוונית שדרכה עברו מילים עבריות רבות מערבה.' },
  { term: 'געז', title: 'געז',
    def: 'שפה שמית עתיקה של אתיופיה, ולשון הקודש של הנצרות האתיופית עד היום. היא אֵם השפות אמהרית ותיגרינית. נכתבת באלפבית משלה.' },
  { term: 'רוטוולש', title: 'רוטוולש (Rotwelsch)',
    def: 'שפת סתרים של נוודים, רוכלים וגנבים בגרמניה, מלאה מילים עבריות ויידיות. שימשה כדי לדבר בלי שזרים (וׁשוטרים) יבינו — ולכן היא צינור מרכזי שדרכו זלגו מילים עבריות לגרמנית.' },
  { term: 'ארמית', title: 'ארמית',
    def: 'שפה שמית, אחות קרובה של העברית, שהייתה השפה הבינלאומית של המזרח הקדום במשך מאות שנים. חלקים מספרי דניאל ועזרא ורוב התלמוד כתובים בה. פעמים רבות מילה עברית עברה דרך הארמית בדרכה החוצה.' },
  { term: 'אכדית', title: 'אכדית',
    def: 'השפה השמית של אשור ובבל העתיקות, שנכתבה בכתב היתדות. מהעתיקות שבשפות המתועדות בעולם (מהאלף ה־3 לפנה"ס). כמה מילים "עבריות" הן בעצם שאולות ממנה.' },
  { term: 'פרוטו־שמית', aliases: ['פרוטו־שמי', 'הפרוטו־שמית'], title: 'פרוטו־שמית',
    def: 'שפת האֵם המשוחזרת שממנה התפצלו כל השפות השמיות — עברית, ערבית, ארמית, אכדית, געז ועוד. איש לא כתב בה מעולם: היא שחזור מדעי, המסומן בכוכבית (*). כששתי מילים יורשות ממנה שורש משותף — הן קוגנטים, לא הַשְׁאָלה.' },
  { term: 'פיניקית', title: 'פיניקית',
    def: 'שפה כנענית, אחות של העברית, שדיברו בה סוחרי הים מצור וצידון. מהאלפבית הפיניקי נולדו האלפבית היווני והלטיני — ולכן היוונים שאלו מילים רבות דווקא "מהשמית של הסוחרים".' },
  { term: 'כנענית', title: 'שפות כנעניות',
    def: 'ענף בשפות השמיות שאליו שייכות עברית, פיניקית, מואבית ואוגריתית. שפות אחיות שחלקו אלפבית ואוצר מילים.' },
  { term: 'אוגריתית', title: 'אוגריתית',
    def: 'שפה כנענית עתיקה מהעיר אוגרית (בסוריה של היום, האלף ה־2 לפנה"ס). חשובה מאוד להשוואה עם העברית המקראית — הרבה שורשים משותפים.' },
  { term: 'יידיש', title: 'יידיש',
    def: 'שפת יהודי אשכנז (מרכז ומזרח אירופה). בנויה על גרמנית ימי־ביניימית, עם שכבות עברית, ארמית וסלבית, ונכתבת באותיות עבריות. דרכה זלגו מילים עבריות רבות לגרמנית, לאנגלית ולהולנדית.' },
  { term: 'לאדינו', title: 'לאדינו',
    def: 'שפת יהודי ספרד (ספרדית־יהודית), שנשתמרה אחרי גירוש 1492. בנויה על ספרדית ימי־ביניימית עם עברית וארמית.' },
  { term: 'בַּרגוּנס', aliases: ['בַּרגונס'], title: 'בַּרגוּנס (Bargoens)',
    def: 'שפת הסתרים של גנבים ורוכלים בהולנד — המקבילה ההולנדית לרוטוולש. ובה מילים עבריות ויידיות רבות, ומכאן הן נכנסו להולנדית המדוברת.' },
  { term: 'פֶניה', aliases: [], title: 'פֶניה (феня)',
    def: 'סלנג עולם הפשע הרוסי. קלט מילים עבריות רבות דרך היידיש — למשל ксива (מ"כתיבה") ו־хевра (מ"חברה").' },
  { term: 'קוגנט', aliases: ['קוגנטים'], title: 'קוגנט (בן־דוד לשוני)',
    def: 'שתי מילים בשתי שפות שדומות כי שתיהן ירשו אותה מילה מאב קדמון משותף — כמו בני־דודים. זו איננה הַשְׁאָלה! שלום/سلام הן קוגנטים, כי עברית וערבית שתיהן בנות הפרוטו־שמית.' },
  { term: 'הַשְׁאָלה', aliases: ['השאלה'], title: 'הַשְׁאָלה (borrowing)',
    def: 'מילה שעברה מדובר לדובר, משפה אחת לאחרת — דרך מסחר, סלנג או תרגומי מקרא. זה הנושא של הכלי הזה: לא ירושה משותפת, אלא מעבר ממשי של מילה בין שפות.' },
  { term: 'אטימולוגיה', aliases: ['אטימולוגי', 'אטימולוגית'], title: 'אטימולוגיה',
    def: 'חקר מקור המילים: מאיפה מילה באה, איך נשמעה בעבר וכיצד השתנתה. "אטימולוגיה עממית" היא הסבר מקור מקובל אך שגוי.' },
  { term: 'אטימולוגיה עממית', title: 'אטימולוגיה עממית',
    def: 'הסבר מקור שנשמע הגיוני ומשכנע — אבל אינו נכון. לרוב נולד מדמיון צלילי מקרי (למשל "copacetic" כאילו מ"הכל בצדק"). זהירות מפניה היא לב העניין בכלי הזה.' },
  { term: 'אונומטופאה', aliases: ['אונומטופאית', 'אונומטופאי'], title: 'אונומטופאה',
    def: 'מילה שנוצרה מחיקוי צליל — כמו "ציוץ", "טפטוף" או babble באנגלית (חיקוי מלמול תינוק). מילים כאלה נולדות שוב ושוב בשפות שונות, בלי שום קשר ביניהן.' },
  { term: 'קאלק', aliases: ['תרגום־שאילה', 'תרגום־השאילה'], title: 'קאלק (תרגום־שאילה)',
    def: 'שאילת מילה על ידי תרגום מילולי של חלקיה — במקום העתקת הצליל. למשל "גורד שחקים" תורגם מ־skyscraper. המילה היוונית χριστός ("המשוח") היא קאלק של מָשִׁיחַ.' },
  { term: 'לינארי B', aliases: ['לינארי'], title: 'כתב לינארי B',
    def: 'כתב הברתי עתיק ששימש לרישום היוונית המיקנית (המאות ה־14–12 לפנה"ס) — מאות שנים לפני האלפבית היווני. הופענה של מילה בו היא עדות עתיקה במיוחד.' },
  { term: 'מיקנית', aliases: ['מיקניים', 'המיקנית'], title: 'יוונית מיקנית',
    def: 'הצורה העתיקה ביותר של היוונית המתועדת בכתב, מתקופת הארמונות (לפני הומרוס). נכתבה בכתב לינארי B.' },
  { term: 'הברית החדשה', title: 'הברית החדשה',
    def: 'אוסף כתבי היסוד של הנצרות, שנכתב יוונית במאה ה־1 לספירה. ציטט מילים עבריות וארמיות רבות (אמן, משיח, גיהינום, רבי) — ודרכו הן התפשטו לכל אירופה.' },
  { term: 'לשון חכמים', title: 'לשון חכמים',
    def: 'העברית של חז"ל — לשון המשנה והתלמוד (בערך המאות ה־1 עד ה־5 לספירה), מאוחרת ללשון המקרא. קלטה מילים רבות מהארמית ומהיוונית.' },
  { term: 'הגייה אשכנזית', title: 'הגייה אשכנזית',
    def: 'מסורת הגיית העברית של יהודי מרכז ומזרח אירופה. סימני היכר: קָמָץ נהגה o (שַׁבָּת→shabbes), ותי"ו רפה נהגית s (בַּיִת→bayes). כך "מלאכה" נעשתה maloche.' },
  { term: 'שי"ן שמאלית', aliases: ['שין שמאלית'], title: 'שי"ן שמאלית (שׂ)',
    def: 'האות שׂ, הנהגית כיום s. בעברית הקדומה כנראה נהגתה כעיצור מיוחד (צדי) — ולכן היא לפעמים משאירה עקבות של l בשפות אחרות, כמו ב"בֹּשֶׂם"→balsamon.' },
  { term: 'דו־תנועה', aliases: ['דו־תנועות'], title: 'דו־תנועה (דיפתונג)',
    def: 'צליל תנועה מחליק, שנע בין שתי תנועות — כמו ay ב"מַיים" או oy. ההגייה האשכנזית הפכה חולם ל־oy (גולם→goylem) וצירה ל־ey.' },
  { term: 'ריבוי־עוצמה', title: 'ריבוי־עוצמה',
    def: 'צורת רבים דקדוקית שאינה מציינת כמות אלא עוצמה או גדוּלה. "בהמות" נראית כרבים אבל מציינת חיה אחת ענקית — בדיוק כמו "אלוהים".' },
  { term: 'שמית', aliases: ['שמיות', 'השמית'], title: 'שפות שמיות',
    def: 'משפחת שפות שכוללת עברית, ערבית, ארמית, אכדית, געז, פיניקית ועוד. כולן צאצאיות של הפרוטו־שמית, ולכן חולקות שורשים ומבנה.' },
  { term: 'שומרית', title: 'שומרית',
    def: 'שפת שומר שבדרום מסופוטמיה — מהשפות הכתובות הקדומות בעולם. אינה שמית כלל (משפחה נפרדת), אך השפיעה על האכדית ודרכה על מילים "נודדות".' },
];

/* ---------- אינדוקס וביטוי חיפוש ---------- */

const LOOKUP = new Map();
for (const e of GLOSSARY) {
  LOOKUP.set(e.term, e);
  for (const a of e.aliases || []) LOOKUP.set(a, e);
}

// מסדרים לפי אורך יורד כדי שמונחים ארוכים ייתפסו לפני קצרים ("תרגום השבעים" לפני "השבעים")
const ALL_TERMS = [...LOOKUP.keys()].sort((a, b) => b.length - a.length);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// אות עברית בסיסית — לבדיקת גבולות מילה. מאפשרים תחילית עברית אחת (ו/ה/ב/ל/מ/ש/כ/מ)
const HEB = '\\u05D0-\\u05EA';
const TERM_RE = new RegExp(
  `(?<![${HEB}])([\\u05D5\\u05D4\\u05D1\\u05DC\\u05DE\\u05E9\\u05DB]?)(${ALL_TERMS.map(escapeRe).join('|')})(?![${HEB}])`,
  'g',
);

/* ---------- סימון (annotate) ---------- */

const SKIP_TAGS = new Set(['A', 'BUTTON', 'SCRIPT', 'STYLE']);

/**
 * סורק את כל צמתי הטקסט תחת root ועוטף מונחי מילון ב-<button class="gloss">.
 * מדלג על טקסט שכבר בתוך קישור/כפתור, וכל מונח מסומן פעם אחת בלבד לכל צומת.
 */
export function annotate(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      for (let p = node.parentElement; p && p !== root.parentElement; p = p.parentElement) {
        if (SKIP_TAGS.has(p.tagName) || p.classList.contains('gloss')) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const targets = [];
  while (walker.nextNode()) targets.push(walker.currentNode);

  for (const node of targets) {
    const text = node.nodeValue;
    TERM_RE.lastIndex = 0;
    if (!TERM_RE.test(text)) continue;
    TERM_RE.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    while ((m = TERM_RE.exec(text))) {
      const [full, prefix, term] = m;
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (prefix) frag.appendChild(document.createTextNode(prefix));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gloss';
      btn.textContent = term;
      btn.dataset.term = term;
      btn.setAttribute('aria-label', `הסבר: ${term}`);
      frag.appendChild(btn);
      last = m.index + full.length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
}

/* ---------- פופאובר ---------- */

let popEl = null;

function ensurePopover() {
  if (popEl) return popEl;
  popEl = document.createElement('div');
  popEl.className = 'gloss-pop';
  popEl.hidden = true;
  popEl.setAttribute('role', 'dialog');
  popEl.innerHTML = '<button class="gloss-pop-close" aria-label="סגור">×</button><h4></h4><p></p>';
  document.body.appendChild(popEl);
  popEl.querySelector('.gloss-pop-close').addEventListener('click', hidePopover);
  return popEl;
}

function hidePopover() {
  if (popEl) popEl.hidden = true;
}

function showPopover(btn) {
  const entry = LOOKUP.get(btn.dataset.term);
  if (!entry) return;
  const pop = ensurePopover();
  pop.querySelector('h4').textContent = entry.title;
  pop.querySelector('p').textContent = entry.def;
  pop.hidden = false;

  // מיקום: מתחת למונח, מיושר לימין (RTL), עם התאמה לגבולות המסך
  const r = btn.getBoundingClientRect();
  const pw = Math.min(320, window.innerWidth - 20);
  pop.style.width = `${pw}px`;
  let left = r.right - pw + window.scrollX;
  left = Math.max(10 + window.scrollX, Math.min(left, window.scrollX + window.innerWidth - pw - 10));
  pop.style.left = `${left}px`;
  pop.style.top = `${r.bottom + window.scrollY + 6}px`;
}

/** מפעיל את מנגנון הפופאובר (פעם אחת). לחיצה על מונח פותחת; לחיצה בחוץ/Esc סוגרת. */
export function initGlossary() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.gloss');
    if (btn) {
      e.preventDefault();
      if (popEl && !popEl.hidden && popEl.dataset.for === btn.dataset.term + btn.getBoundingClientRect().top) {
        hidePopover();
        return;
      }
      showPopover(btn);
      if (popEl) popEl.dataset.for = btn.dataset.term + btn.getBoundingClientRect().top;
      return;
    }
    if (popEl && !popEl.hidden && !e.target.closest('.gloss-pop')) hidePopover();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hidePopover(); });
  window.addEventListener('resize', hidePopover);
}
