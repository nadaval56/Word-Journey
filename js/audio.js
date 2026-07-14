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

/** מיפוי שם השפה (בעברית, כפי שבמאגר) לקוד שפה של TTS. null = אין קול ייעודי. */
function langCode(langLabel) {
  const l = langLabel || '';
  if (/ערבית/.test(l)) return 'ar';
  if (/עברית|ארמית|יידיש/.test(l)) return 'he'; // ליידיש אין קול; עברית הכי קרובה לצורה הכתובה
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

  const code = langCode(langLabel);
  const voice = pickVoice(code);
  // הצורה הראשונה (לפני " / ")
  const primary = (form || '').split('/')[0].trim();

  let text = primary;
  let useCode = code;
  // אם אין קול לשפה והצורה אינה לטינית — עדיף לומר את התעתיק בקול כללי
  if (!voice && !isLatin(primary) && translit) {
    text = translit.split('/')[0].trim();
    useCode = null;
  }
  if (!text) return;

  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  if (useCode) u.lang = useCode;
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
