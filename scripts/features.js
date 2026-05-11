// ============================================================
// FEATURES.JS
// İçindəkilər:
// - PDF Yükləmə Overlay (showPdfLoading, hidePdfLoading)
// - AI Widget (toggleAI, sendMessage, addBotMsg, addUserMsg, typing)
// - AI Sorğu Funksiyası (askAI, buildContext)
// - Test Sistemi (initTestSystem, selectSubject, startTest,
//                 renderQuizQuestion, selectAnswer, finishTest,
//                 renderReview, resetTest, timer)
// - PWA / Service Worker
// - Support Toast
// ============================================================

// ── PDF Yükləmə Overlay ───────────────────────────────────────
let pdfProgressInterval = null;

function showPdfLoading(isDownload) {
  const overlay = document.getElementById('pdfLoadingOverlay');
  const title   = document.getElementById('pdfLoadingTitle');
  const fill    = document.getElementById('pdfProgressFill');

  title.textContent = isDownload ? 'PDF Endirilir...' : 'PDF Açılır...';
  fill.style.width  = '0%';
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  let progress = 0;
  clearInterval(pdfProgressInterval);
  pdfProgressInterval = setInterval(() => {
    if (progress < 90) {
      progress += 30;
      fill.style.width = Math.min(progress, 90) + '%';
    }
  }, 100);

  setTimeout(hidePdfLoading, 4000);
}

function hidePdfLoading() {
  const overlay = document.getElementById('pdfLoadingOverlay');
  const fill    = document.getElementById('pdfProgressFill');

  clearInterval(pdfProgressInterval);
  fill.style.width = '100%';

  setTimeout(() => {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    fill.style.width = '5%';
  }, 300);
}

// ── AI Widget ─────────────────────────────────────────────────
const BACKEND_URL = "https://ericismyhero-github-io.vercel.app";
let aiOpen = false;

function toggleAI() {
  aiOpen = !aiOpen;
  const chat = document.getElementById('ai-chat');
  if (aiOpen) {
    chat.classList.add('ai-open');
    document.getElementById('ai-input').focus();
    if (!document.getElementById('ai-messages').children.length) {
      addBotMsg('Salam! 👋 UNEC materialları haqqında sualını ver — cavablayayım.');
    }
  } else {
    chat.classList.remove('ai-open');
  }
}

function addBotMsg(text) {
  const wrap = document.getElementById('ai-messages');
  const div  = document.createElement('div');
  div.className   = 'ai-msg bot';
  div.textContent = text;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function addUserMsg(text) {
  const wrap = document.getElementById('ai-messages');
  const div  = document.createElement('div');
  div.className   = 'ai-msg user';
  div.textContent = text;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function showTyping() {
  const wrap = document.getElementById('ai-messages');
  const el   = document.createElement('div');
  el.className = 'ai-msg bot typing';
  el.id        = 'ai-typing';
  el.innerHTML = '<span></span><span></span><span></span>';
  wrap.appendChild(el);
  wrap.scrollTop = wrap.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('ai-typing');
  if (el) el.remove();
}

function buildContext(question) {
  if (typeof data === 'undefined') return '';
  const q       = question.toLowerCase();
  const matched = [];
  for (const [course, courseObj] of Object.entries(data)) {
    for (const [subject, subObj] of Object.entries(courseObj.subjects || {})) {
      const words = subject.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (words.filter(w => q.includes(w)).length > 0) {
        const pdfNames = (subObj.pdfs || []).map(p => p.name).join(', ');
        matched.push(`Kurs: ${course} | Fənn: ${subject} | Növ: ${subObj.type} | Semestr: ${subObj.semester} | Materiallar: ${pdfNames}`);
      }
    }
  }
  if (!matched.length) {
    const all = [];
    for (const [course, courseObj] of Object.entries(data))
      for (const subj of Object.keys(courseObj.subjects || {}))
        all.push(`${course}: ${subj}`);
    return `Saytda mövcud fənlər:\n${all.join('\n')}`;
  }
  return matched.join('\n');
}

async function sendMessage() {
  const input = document.getElementById('ai-input');
  const text  = input.value.trim();
  if (!text) return;
  input.value    = '';
  input.disabled = true;
  addUserMsg(text);
  showTyping();

  try {
    const res = await fetch(`${BACKEND_URL}/api/ask`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ question: text, context: buildContext(text) })
    });
    removeTyping();
    if (!res.ok) { addBotMsg('Server xəta verdi (' + res.status + ').'); }
    else { const d = await res.json(); addBotMsg(d.reply || 'Cavab alınmadı.'); }
  } catch (e) {
    removeTyping();
    addBotMsg('Bağlantı xətası.');
  } finally {
    input.disabled = false;
    input.focus();
  }
}

document.getElementById('ai-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});


let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBanner").classList.add("visible");
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; dismissBanner(); });
  }
}

function dismissBanner() {
  document.getElementById("installBanner").classList.remove("visible");
}

window.addEventListener("appinstalled", dismissBanner);

// ── Support Toast ─────────────────────────────────────────────
(function () {
  const SHOW_DELAY   = 8000;
  const INTERVAL     = 30000;
  const VISIBLE_TIME = 5000;
  let toastTimer;

  function showToast() {
    const toast = document.getElementById('supportToast');
    if (!toast) return;
    toast.classList.remove('st-visible');
    void toast.offsetWidth;
    toast.classList.add('st-visible');
    toastTimer = setTimeout(() => toast.classList.remove('st-visible'), VISIBLE_TIME);
  }

  function dismissToast() {
    const toast = document.getElementById('supportToast');
    if (toast) toast.classList.remove('st-visible');
    clearTimeout(toastTimer);
  }

  setTimeout(showToast, SHOW_DELAY);
  setInterval(showToast, INTERVAL);
  window.dismissToast = dismissToast;
})();

// ================================================================
// TEST SİSTEMİ
// ================================================================

// ── Test State ────────────────────────────────────────────────
let testState = {
  initialized:     false,
  selectedSubject: null,
  selectedCount:   10,
  currentQuiz:     [],
  userAnswers:     [],
  currentIndex:    0,
  timerInterval:   null,
  timeLeft:        0
};

// ── Init ──────────────────────────────────────────────────────
function initTestSystem() {
  if (testState.initialized) return;
  testState.initialized = true;
  renderTestSubjects();
}

function renderTestSubjects() {
  const grid = document.getElementById('testSubjectGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const icons = {
    "Mühasibat Uçotu": "📊",
    "İqtisadiyyat":    "📈",
    "Marketinq":       "🎯",
    "Menеcment":       "🏛"
  };
  Object.keys(QUESTION_BANK).forEach(subject => {
    const count = QUESTION_BANK[subject].length;
    const btn   = document.createElement('button');
    btn.className = 'test-subject-btn';
    btn.setAttribute('data-subject', subject);
    btn.innerHTML = `
      <span class="tsb-icon">${icons[subject] || '📚'}</span>
      <span class="tsb-name">${subject}</span>
      <span class="tsb-count">${count} sual</span>
    `;
    btn.onclick = () => selectSubject(subject, btn);
    grid.appendChild(btn);
  });
}

function selectSubject(subject, btn) {
  document.querySelectorAll('.test-subject-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  testState.selectedSubject = subject;

  const config = document.getElementById('testConfigSection');
  const info   = document.getElementById('testSelectedInfo');
  const total  = QUESTION_BANK[subject].length;

  info.innerHTML = `<span class="tsi-label">Seçildi:</span> <strong>${subject}</strong> · <span class="tsi-count">${total} sual mövcuddur</span>`;

  document.querySelectorAll('.test-count-btn').forEach(b => {
    const n = parseInt(b.dataset.count);
    b.disabled = n > total;
    if (n > total) b.classList.add('disabled');
    else           b.classList.remove('disabled');
  });

  const activeBtn = document.querySelector('.test-count-btn.active:not(.disabled)');
  if (!activeBtn) {
    const first = document.querySelector('.test-count-btn:not(.disabled)');
    if (first) { first.classList.add('active'); testState.selectedCount = parseInt(first.dataset.count); }
  }

  config.style.display = '';
  config.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectCount(btn) {
  document.querySelectorAll('.test-count-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  testState.selectedCount = parseInt(btn.dataset.count);
}

// ── Testi Başlat ──────────────────────────────────────────────
function startTest() {
  const subject = testState.selectedSubject;
  const count   = testState.selectedCount;
  if (!subject) return;

  const pool = QUESTION_BANK[subject];
  if (pool.length < count) {
    alert(`Yalnız ${pool.length} sual mövcuddur. Sual sayını azaldın.`);
    return;
  }

  // Sualları qarışdır və dilim
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);

  // Variantları hər sual üçün bir dəfə qarışdır, cavab indeksini yenilə
  testState.currentQuiz = shuffled.map(q => {
    const optionsWithIndex = q.options.map((opt, i) => ({ opt, i }));
    optionsWithIndex.sort(() => Math.random() - 0.5);
    return {
      question: q.question,
      options:  optionsWithIndex.map(o => o.opt),
      answer:   optionsWithIndex.findIndex(o => o.i === q.answer)
    };
  });

  testState.userAnswers  = new Array(count).fill(null);
  testState.currentIndex = 0;
  testState.timeLeft     = count * 60; // 1 dəq per sual

  document.getElementById('test-landing').style.display = 'none';
  document.getElementById('test-result').style.display  = 'none';
  document.getElementById('test-quiz').style.display    = '';

  document.getElementById('qTotalNum').textContent = count;
  renderQuizQuestion();
  startTimer();
}

// ── Timer ──────────────────────────────────────────────────────
function startTimer() {
  clearInterval(testState.timerInterval);
  updateTimerDisplay();
  testState.timerInterval = setInterval(() => {
    testState.timeLeft--;
    updateTimerDisplay();
    if (testState.timeLeft <= 0) {
      clearInterval(testState.timerInterval);
      finishTest();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m       = Math.floor(testState.timeLeft / 60);
  const s       = testState.timeLeft % 60;
  const display = document.getElementById('timerDisplay');
  if (display) {
    display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const timerEl = document.getElementById('testTimer');
    if (testState.timeLeft <= 60) timerEl.classList.add('timer-urgent');
    else                          timerEl.classList.remove('timer-urgent');
  }
}

// ── Sualı Göstər ──────────────────────────────────────────────
function renderQuizQuestion() {
  const idx   = testState.currentIndex;
  const q     = testState.currentQuiz[idx];
  const total = testState.currentQuiz.length;

  document.getElementById('qCurrentNum').textContent = idx + 1;

  const pct = ((idx + 1) / total) * 100;
  document.getElementById('testProgressFill').style.width = pct + '%';

  document.getElementById('testQNumber').textContent = `Sual ${idx + 1}`;
  document.getElementById('testQText').textContent   = q.question;

  const optContainer = document.getElementById('testOptions');
  optContainer.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D', 'E'];

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'test-option-btn';
    if (testState.userAnswers[idx] === i) btn.classList.add('selected');
    btn.innerHTML = `<span class="tob-letter">${letters[i]}</span><span class="tob-text">${opt}</span>`;
    btn.onclick = () => selectAnswer(i);
    optContainer.appendChild(btn);
  });

  const prevBtn   = document.getElementById('testPrevBtn');
  const nextBtn   = document.getElementById('testNextBtn');
  const finishBtn = document.getElementById('testFinishBtn');

  prevBtn.style.display   = idx === 0           ? 'none' : '';
  nextBtn.style.display   = idx === total - 1   ? 'none' : '';
  finishBtn.style.display = idx === total - 1   ? ''     : 'none';

  updateAnsweredInfo();
}

function selectAnswer(optIndex) {
  testState.userAnswers[testState.currentIndex] = optIndex;
  document.querySelectorAll('.test-option-btn').forEach((btn, i) => {
    btn.classList.toggle('selected', i === optIndex);
  });
  updateAnsweredInfo();

  // Son sual deyilsə 400ms sonra irəli keç
  if (testState.currentIndex < testState.currentQuiz.length - 1) {
    setTimeout(() => quizNav(1), 380);
  }
}

function updateAnsweredInfo() {
  const answered = testState.userAnswers.filter(a => a !== null).length;
  const total    = testState.currentQuiz.length;
  const el       = document.getElementById('testAnsweredInfo');
  if (el) el.textContent = `${answered} / ${total} sual cavablandı`;
}

function quizNav(dir) {
  const newIdx = testState.currentIndex + dir;
  if (newIdx < 0 || newIdx >= testState.currentQuiz.length) return;
  testState.currentIndex = newIdx;

  const card = document.getElementById('testQuestionCard');
  card.classList.add('quiz-slide-out');
  setTimeout(() => {
    renderQuizQuestion();
    card.classList.remove('quiz-slide-out');
    card.classList.add('quiz-slide-in');
    setTimeout(() => card.classList.remove('quiz-slide-in'), 300);
  }, 150);
}

function confirmFinishTest() {
  const unanswered = testState.userAnswers.filter(a => a === null).length;
  if (unanswered > 0 && !confirm(`${unanswered} sual cavabsız qalıb. Yenə də bitirmək istəyirsiniz?`)) return;
  finishTest();
}

// ── Testi Bitir ───────────────────────────────────────────────
function finishTest() {
  clearInterval(testState.timerInterval);

  let correct = 0;
  testState.currentQuiz.forEach((q, i) => {
    if (testState.userAnswers[i] === q.answer) correct++;
  });
  const total   = testState.currentQuiz.length;
  const pct     = Math.round((correct / total) * 100);
  const wrong   = total - correct - testState.userAnswers.filter(a => a === null).length;
  const skipped = testState.userAnswers.filter(a => a === null).length;

  document.getElementById('test-quiz').style.display   = 'none';
  document.getElementById('test-result').style.display = '';

  let emoji, title;
  if (pct >= 90)      { emoji = '🏆'; title = 'Əla nəticə!'; }
  else if (pct >= 75) { emoji = '🎉'; title = 'Yaxşı nəticə!'; }
  else if (pct >= 50) { emoji = '👍'; title = 'Orta nəticə'; }
  else                { emoji = '📚'; title = 'Daha çox məşq lazımdır'; }

  document.getElementById('resultEmoji').textContent   = emoji;
  document.getElementById('resultTitle').textContent   = title;
  document.getElementById('resultScore').textContent   = `${correct} / ${total}`;
  document.getElementById('resultPercent').textContent = `${pct}%`;
  document.getElementById('resultStats').innerHTML =
    `<span class="rs-correct">✓ ${correct} düzgün</span>` +
    `<span class="rs-wrong">✗ ${wrong} yanlış</span>` +
    (skipped ? `<span class="rs-skip">– ${skipped} keçildi</span>` : '');

  setTimeout(() => {
    const bar = document.getElementById('resultBarFill');
    if (bar) {
      bar.style.width      = pct + '%';
      bar.style.background = pct >= 75 ? 'var(--accent2)' : pct >= 50 ? 'var(--accent)' : '#ef4444';
    }
  }, 100);

  renderReview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── İcmalı Göstər ─────────────────────────────────────────────
function renderReview() {
  const list    = document.getElementById('testReviewList');
  list.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D', 'E'];

  testState.currentQuiz.forEach((q, i) => {
    const ua        = testState.userAnswers[i];
    const isCorrect = ua === q.answer;
    const isSkipped = ua === null;

    const card = document.createElement('div');
    card.className = `review-item ${isCorrect ? 'ri-correct' : isSkipped ? 'ri-skip' : 'ri-wrong'}`;

    let optHtml = '';
    q.options.forEach((opt, j) => {
      let cls = 'ro-opt';
      if (j === q.answer)            cls += ' ro-correct';
      else if (j === ua && !isCorrect) cls += ' ro-wrong';
      optHtml += `<div class="${cls}"><span class="ro-letter">${letters[j]}</span>${opt}</div>`;
    });

    card.innerHTML = `
      <div class="ri-header">
        <span class="ri-num">${i + 1}</span>
        <span class="ri-badge">${isCorrect ? '✓ Düzgün' : isSkipped ? '— Keçildi' : '✗ Yanlış'}</span>
      </div>
      <div class="ri-question">${q.question}</div>
      <div class="ri-options">${optHtml}</div>
    `;
    list.appendChild(card);
  });
}

// ── Reset ──────────────────────────────────────────────────────
function resetTest() {
  clearInterval(testState.timerInterval);
  testState.currentQuiz  = [];
  testState.userAnswers  = [];
  testState.currentIndex = 0;

  document.getElementById('test-quiz').style.display    = 'none';
  document.getElementById('test-result').style.display  = 'none';
  document.getElementById('test-landing').style.display = '';

  const fill = document.getElementById('resultBarFill');
  if (fill) fill.style.width = '0%';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
