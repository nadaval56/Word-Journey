/**
 * journey-view.js — כל הרינדור של מסעי מילים:
 * כרטיסי רשימה, עמוד מילה, רצועת מסע (Journey Strip) ועץ הסתעפות.
 *
 * הערה על כיווניות: העמוד כולו RTL, ולכן רצועת מסע (flex רגיל) זורמת
 * מימין לשמאל — המקור העברי מימין, היעד הלועזי משמאל, כיוון הקריאה הטבעי.
 * צורות לועזיות נעטפות ב-<bdi> כדי שלא ישבשו את סדר התווים.
 */

let META = null;
let LAW_BY_ID = {};

/** חייבים לקרוא פעם אחת לפני שימוש — מזריק את המטא־נתונים (תוויות). */
export function initViews(meta) {
  META = meta;
  LAW_BY_ID = {};
  (meta.soundLaws || []).forEach((law) => { LAW_BY_ID[law.id] = law; });
}

/* ---------- כלי עזר ---------- */

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

/** עוטף צורה לועזית ב-bdi לבידוד כיווני. */
function bdi(str) {
  return `<bdi>${esc(str)}</bdi>`;
}

/** כפתור השמעה (TTS) לתחנה — הטיפול בלחיצה ב-audio.js. */
function sayBtn(station) {
  const form = station.form || '';
  return `<button type="button" class="say" data-say="${esc(form)}" data-translit="${esc(station.translit || '')}" data-lang="${esc(station.lang || '')}" aria-label="השמעת ${esc(form)}" title="השמע">🔊</button>`;
}

/** תגי חוקי הצליל שתחנה מדגימה — לחיצים לסינון (הטיפול ב-app.js). */
function lawChips(station) {
  if (!station.laws || !station.laws.length) return '';
  const chips = station.laws.map((id) => {
    const law = LAW_BY_ID[id];
    if (!law) return '';
    return `<span class="law-chip" data-filter-type="law" data-filter-value="${esc(id)}" role="button" tabindex="0" title="חוק צליל: ${esc(law.name)} — לחצו לכל המילים">${esc(law.symbol)}</span>`;
  }).join('');
  return chips ? `<span class="hop-laws">${chips}</span>` : '';
}

/**
 * ממפה מחרוזת מקור (למשל 'Duden – "Zoff"') לכתובת URL.
 * מילונים מוכרים → קישור ישיר לערך; כל השאר (ספרים, הפניות מקרא, אתרים
 * ייעודיים) → חיפוש גוגל של הציטוט, כדי שכל מקור יהיה לחיץ.
 */
function sourceUrl(src) {
  const e = encodeURIComponent;
  // כותרת הערך: המונח הראשון במרכאות, ואם אין — הטקסט שאחרי המקף
  let hw = null;
  const q = src.match(/"([^"]+)"/);
  if (q) {
    hw = q[1];
  } else {
    const parts = src.split(/\s[–—-]\s/);
    if (parts.length > 1) hw = parts[1].split(/[,(]/)[0].trim();
  }
  const has = hw && hw.length > 0;

  const wk = /^(?:(nl|de|hu|ru|en)\.)?Wiktionary/i.exec(src);
  if (wk && has) return `https://${(wk[1] || 'en').toLowerCase()}.wiktionary.org/wiki/${e(hw)}`;
  if (/^Etymonline/i.test(src) && has) return `https://www.etymonline.com/search?q=${e(hw)}`;
  if (/^DWDS/i.test(src) && has) return `https://www.dwds.de/wb/${e(hw)}`;
  if (/^Duden/i.test(src) && has) return `https://www.duden.de/suchen/dudenonline/${e(hw)}`;
  if (/^OED/i.test(src) && has) return `https://www.oed.com/search/dictionary/?scope=Entries&q=${e(hw)}`;
  if (/^Merriam-Webster/i.test(src) && has) return `https://www.merriam-webster.com/dictionary/${e(hw)}`;
  if (/^Etymologiebank/i.test(src) && has) return `https://etymologiebank.nl/trefwoord/${e(hw)}`;
  if (/^RAE/i.test(src) && has) return `https://dle.rae.es/${e(hw)}`;
  if (/^(TLFi|CNRTL)/i.test(src) && has) return `https://www.cnrtl.fr/etymologie/${e(hw)}`;
  if (/^Dictionary\.com/i.test(src) && has) return `https://www.dictionary.com/browse/${e(hw)}`;
  if (/^Collins/i.test(src) && has) return `https://www.collinsdictionary.com/dictionary/english/${e(hw)}`;
  if (/^Britannica/i.test(src)) return `https://www.britannica.com/search?query=${e(has ? hw : src)}`;
  if (/^Wikipedia/i.test(src)) {
    const lang = /גרמנית/.test(src) ? 'de' : /עברית/.test(src) ? 'he' : 'en';
    return has ? `https://${lang}.wikipedia.org/wiki/${e(hw)}` : `https://${lang}.wikipedia.org/`;
  }
  // ברירת מחדל: חיפוש גוגל של הציטוט המלא — כך גם ספרים והפניות מקרא הופכים ללחיצים
  return `https://www.google.com/search?q=${e(src)}`;
}

/** עוטף מחרוזת מקור בקישור נפתח בכרטיסייה חדשה. */
function sourceLink(src) {
  return `<a class="source-link" href="${esc(sourceUrl(src))}" target="_blank" rel="noopener noreferrer">${esc(src)}</a>`;
}

// כל תג ודאות/מנגנון נושא data-filter-* והוא לחיץ: לחיצה מסננת את הרשימה
// (המימוש ב-app.js). role/tabindex הופכים אותו נגיש גם למקלדת.
export function certaintyBadge(certainty) {
  const label = META?.certainty?.[certainty]?.label || certainty;
  const warn = certainty === 'folk' ? '⚠️ ' : '';
  return `<span class="badge badge-${esc(certainty)}" data-filter-type="certainty" data-filter-value="${esc(certainty)}" role="button" tabindex="0" title="הצגת כל הערכים בתגית: ${esc(label)}">${warn}${esc(label)}</span>`;
}

export function mechanismBadge(mechanism) {
  const label = META?.mechanisms?.[mechanism]?.short || mechanism;
  return `<span class="badge badge-mechanism" data-filter-type="mechanism" data-filter-value="${esc(mechanism)}" role="button" tabindex="0" title="הצגת כל הערכים במנגנון: ${esc(label)}">${esc(label)}</span>`;
}

/* ---------- רשימת מילים ---------- */

/** כרטיס מילה ברשימה הראשית. */
export function renderWordCard(word) {
  const card = el('a', `word-card ${word.certainty === 'folk' ? 'folk' : ''}`);
  card.href = `#/word/${word.id}`;

  const targets = word.finalStations
    .map((s) => `${bdi(s.form)} (${esc(s.lang)})`)
    .join(' · ');

  card.innerHTML = `
    <div class="word-card-head">
      <h3 class="hebrew-word">${esc(word.hebrew)}</h3>
      ${certaintyBadge(word.certainty)}
    </div>
    <p class="word-meaning">${esc(word.meaning)}</p>
    <p class="word-targets">⟵ ${targets}</p>
    <div class="word-card-badges">
      ${word.allMechanisms.map(mechanismBadge).join('')}
      ${word.journeys.length > 1 ? '<span class="badge badge-mechanism">🌳 מסלול מסועף</span>' : ''}
    </div>`;
  return card;
}

export function renderWordList(words, container) {
  container.innerHTML = '';
  if (!words.length) {
    container.appendChild(el('p', 'empty-state', 'לא נמצאו מילים מתאימות 🤷'));
    return;
  }
  words.forEach((w) => container.appendChild(renderWordCard(w)));
}

/* ---------- רצועת מסע ---------- */

/**
 * רצועת מסע: תחנה ← (שינוי) ← תחנה.
 * אופקית בדסקטופ, אנכית במובייל (ראו ה-CSS) כדי לא לפרוץ את רוחב העמוד.
 * @param {Object} journey - מסלול אחד ({title, path})
 */
export function renderJourneyStrip(journey) {
  const strip = el('div', 'journey-strip');
  // מסלול ארוך (4+ תחנות) פורץ את רוחב העמוד בדסקטופ — מציגים אותו במאונך
  if (journey.path.length >= 4) strip.classList.add('journey-strip--long');

  journey.path.forEach((station, i) => {
    if (i > 0) {
      // המחבר בין תחנות — כאן מוצג ה-change, הבשר החינוכי
      const hop = el('div', 'hop');
      hop.innerHTML = `
        <span class="hop-arrow" aria-hidden="true">⟵</span>
        ${station.change ? `<span class="hop-change">${esc(station.change)}</span>` : ''}
        ${lawChips(station)}`;
      strip.appendChild(hop);
    }
    const card = el('div', `station ${i === 0 ? 'origin' : ''}`);
    card.innerHTML = `
      <p class="station-lang">${esc(station.lang)} ${sayBtn(station)}</p>
      <p class="station-form">${bdi(station.form)}</p>
      ${station.translit ? `<p class="station-translit">${bdi(station.translit)}</p>` : ''}
      ${station.meaning ? `<p class="station-meaning">${esc(station.meaning)}</p>` : ''}
      ${station.note ? `<p class="station-note">${esc(station.note)}</p>` : ''}`;
    strip.appendChild(card);
  });
  return strip;
}

/* ---------- עץ הסתעפות ---------- */

/**
 * בונה עץ ממוזג מכמה מסלולים: תחנות זהות בתחילת מסלולים (אותה שפה+צורה)
 * מתאחדות לצומת אחד, וההמשכים מסתעפים ממנו.
 */
function buildTree(journeys) {
  const root = { station: null, children: [] };
  journeys.forEach((j) => {
    let node = root;
    j.path.forEach((station) => {
      let child = node.children.find(
        (c) => c.station.lang === station.lang && c.station.form === station.form,
      );
      if (!child) {
        child = { station, children: [] };
        node.children.push(child);
      }
      node = child;
    });
  });
  return root;
}

function renderTreeNode(node, isOrigin) {
  const wrap = el('div', 'tree-branch');
  if (node.station.change) {
    wrap.appendChild(el('p', 'tree-change', `${esc(node.station.change)} ${lawChips(node.station)}`));
  }
  const card = el('div', `tree-node-card ${isOrigin ? 'origin' : ''}`);
  card.innerHTML = `
    <p class="station-lang">${esc(node.station.lang)} ${sayBtn(node.station)}</p>
    <p class="station-form">${bdi(node.station.form)}${node.station.translit ? ` · <bdi>${esc(node.station.translit)}</bdi>` : ''}</p>
    ${node.station.meaning ? `<p class="station-meaning">${esc(node.station.meaning)}</p>` : ''}`;
  wrap.appendChild(card);

  if (node.children.length) {
    const kids = el('div', 'tree-children');
    node.children.forEach((c) => kids.appendChild(renderTreeNode(c, false)));
    wrap.appendChild(kids);
  }
  return wrap;
}

export function renderTree(journeys) {
  const tree = el('div', 'tree');
  const root = buildTree(journeys);
  // ברמה העליונה בדרך כלל צומת יחיד — המקור העברי
  root.children.forEach((c) => tree.appendChild(renderTreeNode(c, true)));
  return tree;
}

/* ---------- עמוד מילה מלא ---------- */

export function renderWordDetail(word, container) {
  container.innerHTML = '';

  // כותרת
  const header = el('header', 'word-header');
  header.innerHTML = `
    <div class="word-card-badges">
      ${certaintyBadge(word.certainty)}
      ${word.allMechanisms.map(mechanismBadge).join('')}
    </div>
    <h2>${esc(word.hebrew)}</h2>
    <p class="translit">${bdi(word.translit)} · ${esc(word.meaning)}</p>`;
  container.appendChild(header);

  // אזהרת אטימולוגיה עממית — לפני הכל, בולטת (מנדט סעיף 4)
  if (word.certainty === 'folk') {
    const warn = el('div', 'folk-warning');
    warn.setAttribute('role', 'alert');
    warn.innerHTML = `
      <h3>⚠️ אטימולוגיה עממית — נדחתה במחקר</h3>
      <p><strong>הטענה:</strong> ${esc(word.folkClaim)}</p>
      <p><strong>למה זה לא מחזיק מים:</strong> ${esc(word.debunk)}</p>
      <p>המסלול המוצג למטה הוא <strong>הטענה העממית</strong>, לא מסע מתועד.</p>`;
    container.appendChild(warn);
  }

  if (word.certainty === 'debated') {
    const warn = el('div', 'debated-warning');
    warn.innerHTML = '<strong>🟠 שנוי במחלוקת:</strong> במחקר קיימות אטימולוגיות מתחרות — המסלולים למטה הם השערות, לא עובדה אחת מוסכמת.';
    container.appendChild(warn);
  }

  if (word.note) {
    container.appendChild(el('div', 'word-note', `💡 ${esc(word.note)}`));
  }

  // מילה מסועפת: מתג בין תצוגת עץ למסלולים; אחרת — רצועה בלבד
  const journeysWrap = el('div');
  if (word.journeys.length > 1) {
    const toggle = el('div', 'view-toggle');
    const btnTree = el('button', 'active', '🌳 עץ הסתעפות');
    const btnStrips = el('button', '', '🛤️ מסלול־מסלול');
    toggle.append(btnTree, btnStrips);
    container.appendChild(toggle);

    const show = (mode) => {
      btnTree.classList.toggle('active', mode === 'tree');
      btnStrips.classList.toggle('active', mode === 'strips');
      journeysWrap.innerHTML = '';
      if (mode === 'tree') {
        journeysWrap.appendChild(renderTree(word.journeys));
      } else {
        renderStrips(word, journeysWrap);
      }
    };
    btnTree.addEventListener('click', () => show('tree'));
    btnStrips.addEventListener('click', () => show('strips'));
    show('tree');
  } else {
    renderStrips(word, journeysWrap);
  }
  container.appendChild(journeysWrap);

  // מקורות — כל ערך חייב להישען על מקור (מנדט סעיף 4)
  const sources = el('div', 'sources');
  sources.innerHTML = `
    <strong>📚 מקורות:</strong>
    <ul>${word.sources.map((s) => `<li>${sourceLink(s)}</li>`).join('')}</ul>`;
  container.appendChild(sources);
}

function renderStrips(word, container) {
  word.journeys.forEach((j) => {
    const block = el('div', 'journey-block');
    if (j.title) block.appendChild(el('h3', 'journey-title', esc(j.title)));
    block.appendChild(renderJourneyStrip(j));
    container.appendChild(block);
  });
}

/* ---------- אינדקס חוקי הצליל ---------- */

/** מרנדר את כרטיסי חוקי הצליל. כל כרטיס לחיץ ומסנן את הרשימה לפי החוק. */
export function renderLawsIndex(data, container) {
  container.innerHTML = '';
  (data.meta.soundLaws || []).forEach((law) => {
    const count = data.words.filter((w) => w.allLaws.includes(law.id)).length;
    const card = el('div', 'law-card');
    card.dataset.filterType = 'law';
    card.dataset.filterValue = law.id;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="law-symbol">${esc(law.symbol)}</div>
      <div class="law-body">
        <h3 class="law-name">${esc(law.name)}</h3>
        <p class="law-desc">${esc(law.description)}</p>
        <span class="law-count">← הצגת ${count} המילים שמדגימות את החוק</span>
      </div>`;
    container.appendChild(card);
  });
}

/** מחזיר את שם חוק הצליל לפי מזהה (לשימוש ב-app.js בשורת הסינון). */
export function lawName(id) {
  return LAW_BY_ID[id]?.name || id;
}
