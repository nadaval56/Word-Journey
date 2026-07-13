/**
 * app.js — נקודת הכניסה: טעינת המאגר, ניתוב (hash routing), חיפוש וסינון.
 *
 * מסלולים:
 *   #/browse       — רשימת המילים + סינון (ברירת המחדל)
 *   #/word/<id>    — עמוד מילה: מסע / עץ הסתעפות
 *   #/game         — מצב בלש
 *   #/about        — הסבר: הַשְׁאָלה מול קרבה
 */

import { loadData, filterWords, collectTargetLangs, getWord } from './data-loader.js';
import { initViews, renderWordList, renderWordDetail, certaintyBadge } from './journey-view.js';
import { initGame } from './game.js';

let data = null;
const filters = { query: '', mechanism: '', certainty: '', lang: '' };

const $ = (sel) => document.querySelector(sel);

/* ---------- ניתוב ---------- */

function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name, param] = hash.split('/');
  return { name: name || 'browse', param: param || null };
}

function route() {
  const { name, param } = parseRoute();

  document.querySelectorAll('.view').forEach((v) => { v.hidden = true; });
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.route === name || (name === 'word' && t.dataset.route === 'browse'));
  });

  switch (name) {
    case 'word': {
      const word = param && getWord(data, param);
      if (word) {
        renderWordDetail(word, $('#word-detail'));
        $('#view-word').hidden = false;
      } else {
        location.hash = '#/browse';
      }
      break;
    }
    case 'game':
      initGame($('#game-container'), data);
      $('#view-game').hidden = false;
      break;
    case 'about':
      $('#view-about').hidden = false;
      break;
    default:
      applyFilters();
      $('#view-browse').hidden = false;
  }
  window.scrollTo(0, 0);
}

/* ---------- חיפוש וסינון ---------- */

function applyFilters() {
  const result = filterWords(data.words, filters);
  renderWordList(result, $('#word-list'));
  $('#results-count').textContent = `${result.length} מתוך ${data.words.length} מילים`;
}

function setupFilters() {
  // מנגנונים ורמות ודאות — מתוך המטא של המאגר, כדי שהכל יישאר מסונכרן
  const mechSelect = $('#filter-mechanism');
  Object.entries(data.meta.mechanisms).forEach(([key, m]) => {
    mechSelect.appendChild(new Option(m.label, key));
  });

  const certSelect = $('#filter-certainty');
  Object.entries(data.meta.certainty).forEach(([key, c]) => {
    certSelect.appendChild(new Option(c.label, key));
  });

  const langSelect = $('#filter-lang');
  collectTargetLangs(data.words).forEach((lang) => {
    langSelect.appendChild(new Option(lang, lang));
  });

  $('#search-input').addEventListener('input', (e) => {
    filters.query = e.target.value;
    applyFilters();
  });
  mechSelect.addEventListener('change', (e) => { filters.mechanism = e.target.value; applyFilters(); });
  certSelect.addEventListener('change', (e) => { filters.certainty = e.target.value; applyFilters(); });
  langSelect.addEventListener('change', (e) => { filters.lang = e.target.value; applyFilters(); });

  // מקרא תגי ודאות מתחת לסינון
  const legend = Object.keys(data.meta.certainty).map(certaintyBadge).join(' ');
  $('#certainty-legend').innerHTML = legend;
  $('#about-certainty').innerHTML = legend;
}

/** ממלא את רשימת המנגנונים בעמוד ההסבר מתוך המטא. */
function setupAbout() {
  const list = $('#about-mechanisms');
  list.innerHTML = Object.values(data.meta.mechanisms)
    .map((m) => `<li><strong>${m.label}:</strong> ${m.description}</li>`)
    .join('');
}

/* ---------- אתחול ---------- */

async function boot() {
  try {
    data = await loadData();
  } catch (err) {
    console.error(err);
    $('#load-error').hidden = false;
    return;
  }
  initViews(data.meta);
  setupFilters();
  setupAbout();
  window.addEventListener('hashchange', route);
  route();
}

boot();
