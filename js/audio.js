/**
 * audio.js — השמעת התחנות (TTS) כדי "לשמוע את השחיקה".
 *
 * משתמש ב-Web Speech API המובנה בדפדפן (SpeechSynthesis) — בלי קבצי אודיו
 * ובלי רשת. לכל תחנה כפתור 🔊: לוחצים ושומעים את הצורה נהגית בשפת התחנה,
 * וכך שומעים איך שַׁבָּת הופכת ל-shabes ול-samedi.
 *
 * מגבלה מובנית: איכות ההגייה תלויה בקולות המותקנים בדפדפן/מערכת ההפעלה.
 * לשפות בלי קול זמין (געז, אכדית, פיניקית) נופלים לתעתיק הלטיני בקול ברירת המחדל.
 */

const synth = window.speechSynthesis;

/** מיפוי שם השפה (בעברית, כפי שבמאגר) לקוד שפה של TTS. null = אין קול ייעודי.
 *  הערה: יידיש מטופלת בנפרד ב-speak() — היא נכתבת באותיות עבריות אך נהגית
 *  אחרת, ולכן משמיעים לה את התעתיק ולא את הצורה. */
function langCode(langLabel) {
  const l = langLabel || '';
  if (/ערבית/.test(l)) return 'ar';
  if (/עברית|ארמית/.test(l)) return 'he';
  if (/יוונית/.test(l)) return 'el';
  if (/לטינית/.test(l)) return 'it';            // אין קול ללטינית; איטלקית קרובה בהגייה
  if (/צרפתית/.test(l)) return 'fr';
  if (/ספרדית/.test(l)) return 'es';
  if (/איטלקית/.test(l)) return 'it';
  if (/גרמנית|רוטוולש/.test(l)) return 'de';
  if (/אנגלית/.test(l)) return 'en';
  if (/הולנדית/.test(l)) return 'nl';
  if (/הונגרית/.test(l)) return 'hu';
  if (/רוסית/.test(l)) return 'ru';
  if (/סינית/.test(l)) return 'zh';
  return null; // געז, אכדית, פיניקית, פונית, כנענית...
}

/** האם הטקסט כתוב באותיות לטיניות (ואז אפשר לומר אותו בכל קול). */
function isLatin(str) {
  return /[A-Za-z]/.test(str) && !/[֐-׿Ͱ-Ͽ؀-ۿЀ-ӿ一-鿿]/.test(str);
}

let voices = [];
function loadVoices() { voices = synth ? synth.getVoices() : []; }
if (synth) {
  loadVoices();
  synth.addEventListener?.('voiceschanged', loadVoices);
}

/** בוחר קול מתאים לקוד השפה, אם קיים. */
function pickVoice(code) {
  if (!code) return null;
  return voices.find((v) => v.lang?.toLowerCase().startsWith(code)) || null;
}

/**
 * אומר תחנה. בוחר מה להשמיע: את הצורה המקורית אם יש קול לשפה או אם היא
 * לטינית; אחרת את התעתיק בקול ברירת המחדל.
 */
function speak(form, translit, langLabel) {
  if (!synth) return;
  synth.cancel();

  const label = langLabel || '';
  const primaryForm = (form || '').split('/')[0].trim();
  const primaryTranslit = (translit || '').split('/')[0].trim();

  let text; let code; let voice;

  if (/יידיש/.test(label)) {
    // יידיש נכתבת באותיות עבריות אך נהגית כשפה גרמאנית. קול עברי היה מבטא
    // אותה כעברית מודרנית ("שבת" ← shabbat) — לא המילה האמיתית. לכן משמיעים
    // את התעתיק (shabes) בקול גרמני, הקרוב ביותר פונטית ליידיש.
    const yi = pickVoice('yi'); // אם במקרה מותקן קול יידיש — עדיף
    if (yi) { text = primaryForm; voice = yi; code = 'yi'; }
    else if (primaryTranslit) { text = primaryTranslit; voice = pickVoice('de'); code = 'de'; }
    else { text = primaryForm; voice = pickVoice('he'); code = 'he'; }
  } else {
    code = langCode(label);
    voice = pickVoice(code);
    text = primaryForm;
    // שפה בלי קול וצורה לא־לטינית → אומרים את התעתיק בקול ברירת המחדל
    if (!voice && !isLatin(primaryForm) && primaryTranslit) {
      text = primaryTranslit;
      code = null;
    }
  }
  if (!text) return;

  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  if (code) u.lang = code;
  u.rate = 0.85; // מעט לאט כדי לשמוע את השינוי
  synth.speak(u);
}

/** מפעיל את מנגנון ההשמעה: לחיצה על כפתור .say משמיעה את התחנה. */
export function initAudio() {
  if (!synth) return; // דפדפן בלי תמיכה — הכפתורים פשוט לא יגיבו
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.say');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    speak(btn.dataset.say, btn.dataset.translit, btn.dataset.lang);
  });
}
