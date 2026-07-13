/**
 * journey-view.js — כל הרינדור של מסעי מילים:
 * כרטיסי רשימה, עמוד מילה, רצועת מסע (Journey Strip) ועץ הסתעפות.
 *
 * הערה על כיווניות: העמוד כולו RTL, ולכן רצועת מסע (flex רגיל) זורמת
 * מימין לשמאל — המקור העברי מימין, היעד הלועזי משמאל, כיוון הקריאה הטבעי.
 * צורות לועזיות נעטפות ב-<bdi> כדי שלא ישבשו את סדר התווים.
 */

let META = null;

/** חייבים לקרוא פעם אחת לפני שימוש — מזריק את המטא־נתונים (תוויות). */
export function initViews(meta) {
  META = meta;
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

export function certaintyBadge(certainty) {
  const label = META?.certainty?.[certainty]?.label || certainty;
  const warn = certainty === 'folk' ? '⚠️ ' : '';
  return `<span class="badge badge-${esc(certainty)}">${warn}${esc(label)}</span>`;
}

export function mechanismBadge(mechanism) {
  const label = META?.mechanisms?.[mechanism]?.short || mechanism;
  return `<span class="badge badge-mechanism">${esc(label)}</span>`;
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
 * רצועת מסע אופקית: תחנה ← (שינוי) ← תחנה.
 * @param {Object} journey - מסלול אחד ({title, path})
 * @param {Object} [opts] - { revealCount } להצגה הדרגתית במצב הבלש
 */
export function renderJourneyStrip(journey, opts = {}) {
  const strip = el('div', 'journey-strip');
  const reveal = opts.revealCount ?? journey.path.length;

  journey.path.forEach((station, i) => {
    if (i > 0) {
      // המחבר בין תחנות — כאן מוצג ה-change, הבשר החינוכי
      const hop = el('div', `hop ${i >= reveal ? 'hidden-station' : ''}`);
      hop.innerHTML = `
        <span class="hop-arrow" aria-hidden="true">⟵</span>
        ${station.change ? `<span class="hop-change">${esc(station.change)}</span>` : ''}`;
      strip.appendChild(hop);
    }
    const card = el('div', `station ${i === 0 ? 'origin' : ''} ${i >= reveal ? 'hidden-station' : ''}`);
    card.innerHTML = `
      <p class="station-lang">${esc(station.lang)}</p>
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
    wrap.appendChild(el('p', 'tree-change', esc(node.station.change)));
  }
  const card = el('div', `tree-node-card ${isOrigin ? 'origin' : ''}`);
  card.innerHTML = `
    <p class="station-lang">${esc(node.station.lang)}</p>
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
    <ul>${word.sources.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`;
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
