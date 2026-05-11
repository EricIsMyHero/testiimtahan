// ============================================================
// UI.JS
// İçindəkilər:
// - Naviqasiya (goTo, getCurrentView)
// - Render — Kurslar (renderCourses, openSubjects, switchTab)
// - Render — Fənlər (renderSubjects)
// - Render — PDF Səhifəsi (openPDFs)
// - Render — Əlavələr (renderExtras)
// - Render — Seçilmişlər (renderFavorites, removeFavAndRefresh)
// - Sevimlilər (getFavorites, toggleFavorite, removeFavAndRefresh)
// - Axtarış (initSearch, clearSearch, filterSubjects)
// - Qlobal Event Delegation — PDF düymələri
// - Xəta Bildiriş Modal (openReportModal, closeReportModal, sendReport)
// - Məlumat Paneli (toggleInfoPanel, closeInfoPanel)
// - Easter Egg
// - Təşəkkürlər Modali
// - Klaviatura — ESC
// - Sidebar (toggleSidebar, closeSidebar)
// - About / Privacy / Terms Modal
// - Bottom Nav Tab Sistemi (switchBottomTab, initBottomNav)
// - Başlanğıc (computeStats, applyTranslations, renderCourses, initSearch)
// ============================================================

let currentCourse   = null;
let currentSubject  = null;

// ── getCurrentView ───────────────────────────────────────────
function getCurrentView() {
  if (!document.getElementById('view-home').classList.contains('hidden'))     return 'home';
  if (!document.getElementById('view-subjects').classList.contains('hidden')) return 'subjects';
  return 'pdfs';
}

// ── goTo ─────────────────────────────────────────────────────
function goTo(view) {
  ['home', 'subjects', 'pdfs'].forEach(v => {
    document.getElementById('view-' + v).classList.add('hidden');
  });
  document.getElementById('view-' + view).classList.remove('hidden');
  clearSearch();
  if (view === 'home') renderCourses();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Qlobal Event Delegation — PDF düymələri ──────────────────
function handlePdfClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const url      = btn.dataset.url;
  const file     = btn.dataset.file;
  const action   = btn.dataset.action;
  const category = btn.dataset.category || 'PDF';

  if (action === 'open') {
    showPdfLoading(false);
    gtag('event', 'pdf_click', { event_category: category, event_label: file });
    setTimeout(() => {
      window.open(url, '_blank');
      hidePdfLoading();
    }, 400);
  } else if (action === 'download') {
    showPdfLoading(true);
    gtag('event', 'pdf_download', { event_category: category, event_label: file });
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      a.click();
      hidePdfLoading();
    }, 400);
  }
}

document.getElementById('pdf-items').addEventListener('click', handlePdfClick);
document.getElementById('extras-list').addEventListener('click', handlePdfClick);
document.getElementById('favorites-list').addEventListener('click', handlePdfClick);

// ── Axtarış ──────────────────────────────────────────────────
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  if (!searchInput) return;
  searchInput.placeholder = translations[lang].searchPlaceholder;
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    searchClear.classList.toggle('visible', query.length > 0);
    filterSubjects(query);
  });
}

function clearSearch() {
  const searchInput       = document.getElementById('searchInput');
  const searchClear       = document.getElementById('searchClear');
  const searchResultsInfo = document.getElementById('searchResultsInfo');
  if (searchInput) {
    searchInput.value = '';
    if (searchClear)       searchClear.classList.remove('visible');
    if (searchResultsInfo) searchResultsInfo.textContent = '';
    filterSubjects('');
  }
}

function filterSubjects(query) {
  const grid = document.getElementById('subjects-grid');
  if (!grid) return;
  const cards           = grid.querySelectorAll('.subject-card');
  const semesterHeaders = grid.querySelectorAll('.semester-header');
  const searchResultsInfo = document.getElementById('searchResultsInfo');
  let visibleCount = 0;

  cards.forEach(card => {
    const subjectName = card.querySelector('h4').textContent.toLowerCase();
    const matches = !query || subjectName.includes(query);
    card.style.display = matches ? 'flex' : 'none';
    if (matches) visibleCount++;
  });

  semesterHeaders.forEach(header => {
    header.style.display = query ? 'none' : '';
  });

  if (searchResultsInfo) {
    searchResultsInfo.textContent = query ? `${visibleCount} nəticə tapıldı` : '';
  }
}

// ── Render — Kurslar ─────────────────────────────────────────
function renderCourses() {
  const t    = translations[lang];
  const grid = document.getElementById('courses-grid');
  grid.innerHTML = '';
  Object.entries(data).forEach(([courseName, courseData]) => {
    const subCount = Object.keys(courseData.subjects).length;
    const pdfCount = Object.values(courseData.subjects).reduce((a, subj) => a + subj.pdfs.length, 0);
    const div = document.createElement('div');
    div.className = 'course-card animate-in';
    div.innerHTML = `
      <span class="course-icon">${courseData.icon}</span>
      <h3>${courseName}</h3>
      <div class="sub-count">${subCount} ${t.subjects} · ${pdfCount} ${t.pdfs}</div>
      <div class="tag">${courseName}</div>
    `;
    div.onclick = () => openSubjects(courseName);
    grid.appendChild(div);
  });
}

function openSubjects(courseName) {
  currentCourse = courseName;
  document.getElementById('bc-course').textContent  = courseName;
  document.getElementById('bc-course2').textContent = courseName;
  switchTab('subjects');
  goTo('subjects');
  renderSubjects(courseName);
}

function switchTab(tab) {
  ['subjects', 'extras', 'favorites'].forEach(t => {
    document.getElementById(`tab-${t}-btn`).classList.toggle('active', t === tab);
    document.getElementById(`tab-${t}-content`).classList.toggle('hidden', t !== tab);
  });
  clearSearch();
  if (tab === 'favorites') renderFavorites();
  if (tab === 'extras')    renderExtras();
}

// ── Render — Əlavələr ────────────────────────────────────────
function renderExtras() {
  const t    = translations[lang];
  const list = document.getElementById('extras-list');
  list.innerHTML = '';
  const items = (extrasData[currentCourse] || []);
  if (items.length === 0) {
    list.innerHTML = `<div class="empty-favs">${t.noExtras}</div>`;
    return;
  }
  items.forEach((pdf, index) => {
    const isFav     = getFavorites().includes('pdf-extra/' + pdf.file);
    const typeBadge = getPdfTypeBadgeHTML(pdf.pdfType);
    const div = document.createElement('div');
    div.className = 'pdf-item animate-in';
    div.innerHTML = `
      <div class="pdf-top-row">
        <div class="pdf-file-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706);">
          <span>PDF</span>
        </div>
        <div class="pdf-info">
          <div class="pdf-name"><span class="pdf-number">${index + 1}.</span> ${pdf.name}</div>
          <div class="pdf-meta">Fayl adı: ${pdf.desc || pdf.file} ${typeBadge}</div>
        </div>
      </div>
      <div class="pdf-actions">
        <button class="fav-btn ${isFav ? 'active' : ''}"
          onclick="toggleFavorite('pdf-extra/${pdf.file}', this)"
          title="Sevimlilərə əlavə et">
          ${isFav ? '★' : '☆'}
        </button>
        <button class="pdf-open-btn" data-url="${EXTRAS_BASE}${pdf.file}" data-file="${pdf.file}" data-action="open" data-category="PDF-Extra">
          ↗ ${t.openPdf}
        </button>
        <button class="pdf-download-btn" data-url="${EXTRAS_BASE}${pdf.file}" data-file="${pdf.file}" data-action="download" data-category="PDF-Extra">
          ↓ ${t.downloadPdf}
        </button>
      </div>
    `;
    list.appendChild(div);
  });
}

// ── Render — Seçilmişlər ─────────────────────────────────────
function renderFavorites() {
  const t    = translations[lang];
  const favs = getFavorites();
  const list = document.getElementById('favorites-list');
  list.innerHTML = '';
  const allPdfs = [];

  if (currentCourse) {
    Object.entries(data[currentCourse].subjects).forEach(([subjectName, subj]) => {
      subj.pdfs.forEach(pdf => {
        const path = 'pdf/' + pdf.file;
        if (favs.includes(path))
          allPdfs.push({ name: pdf.name, meta: subjectName, path, color: '', pdfType: pdf.pdfType });
      });
    });
    (extrasData[currentCourse] || []).forEach(pdf => {
      const path = 'pdf-extra/' + pdf.file;
      if (favs.includes(path)) {
        allPdfs.push({ name: pdf.name, meta: pdf.desc || '📦 Əlavə material', path, color: 'background:linear-gradient(135deg,#f59e0b,#d97706)', pdfType: pdf.pdfType });
      }
    });
  }

  if (allPdfs.length === 0) {
    list.innerHTML = `<div class="empty-favs">${t.noFavorites}</div>`;
    return;
  }

  allPdfs.forEach((item, index) => {
    const typeBadge = getPdfTypeBadgeHTML(item.pdfType);
    const div = document.createElement('div');
    div.className = 'pdf-item animate-in';
    div.innerHTML = `
      <div class="pdf-top-row">
        <div class="pdf-file-icon" ${item.color ? `style="${item.color}"` : ''}><span>PDF</span></div>
        <div class="pdf-info">
          <div class="pdf-name"><span class="pdf-number">${index + 1}.</span> ${item.name}</div>
          <div class="pdf-meta">Fayl adı: ${item.meta} ${typeBadge}</div>
        </div>
      </div>
      <div class="pdf-actions">
        <button class="fav-btn active" onclick="removeFavAndRefresh('${item.path}')" title="Sil">★</button>
        <button class="pdf-open-btn" data-url="${BASE}${item.path}" data-file="${item.path}" data-action="open" data-category="PDF-Favorite">
          ↗ ${t.openPdf}
        </button>
        <button class="pdf-download-btn" data-url="${BASE}${item.path}" data-file="${item.path}" data-action="download" data-category="PDF-Favorite">
          ↓ ${t.downloadPdf}
        </button>
      </div>
    `;
    list.appendChild(div);
  });
}

function removeFavAndRefresh(filePath) {
  let favs = getFavorites().filter(f => f !== filePath);
  localStorage.setItem("favorites", JSON.stringify(favs));
  renderFavorites();
}

// ── Render — Fənlər (Semester qrupları ilə) ──────────────────
function renderSubjects(courseName) {
  const t    = translations[lang];
  const grid = document.getElementById('subjects-grid');
  grid.innerHTML = '';
  const icons = ['📊','📐','🗓','💡','📝','📈','🔬','⚙️','🎯','📌','🏛','💰','📉','🌿','🔗','📋','🧮','🏆'];

  const allEntries = Object.entries(data[courseName].subjects);
  const sem1 = allEntries.filter(([, subj]) => subj.semester === 1);
  const sem2 = allEntries.filter(([, subj]) => subj.semester === 2);

  let iconIndex = 0;

  function renderGroup(entries, labelText) {
    if (entries.length === 0) return;
    const header = document.createElement('div');
    header.className = 'semester-header';
    header.textContent = labelText;
    grid.appendChild(header);

    entries.forEach(([subjectName, subj]) => {
      const div = document.createElement('div');
      div.className = 'subject-card animate-in';
      div.innerHTML = `
        <div class="subject-icon">${icons[iconIndex % icons.length]}</div>
        <div class="subject-info">
          <h4>${subjectName}</h4>
          <div class="pdf-count">
            ${getTypeBadgeHTML(subj.type)}
            <span class="pdf-badge">PDF ${subj.pdfs.length}</span>
          </div>
        </div>
      `;
      div.onclick = () => openPDFs(subjectName);
      grid.appendChild(div);
      iconIndex++;
    });
  }

  renderGroup(sem1, t.semesterFall);
  renderGroup(sem2, t.semesterSpring);
}

// ── PDF Səhifəsi ─────────────────────────────────────────────
function openPDFs(subjectName) {
  currentSubject = subjectName;
  const t     = translations[lang];
  const subj  = data[currentCourse].subjects[subjectName];
  const pdfs  = subj.pdfs;
  const type  = subj.type;
  const notes = EXAM_NOTES[type] || [];

  document.getElementById('bc-subject').textContent = subjectName;

  const titleEl = document.getElementById('pdf-subject-title');
  titleEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span>${subjectName}</span>
      <button class="info-btn" onclick="toggleInfoPanel()" title="Bu fənn haqqında">?</button>
    </div>
    <div style="margin-top:6px;">${getTypeBadgeHTML(type)}</div>
  `;

  const existing = document.getElementById('subject-info-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id        = 'subject-info-panel';
  panel.className = 'info-panel hidden';
  panel.innerHTML = `
    <div class="info-panel-inner info-panel-${type}">
      <div class="info-panel-header">
        <span class="info-panel-title">${type === 'test' ? '🖥️ Elektron-test haqqında' : '✍️ Elektron-yazılı haqqında'}</span>
        <button class="info-panel-close" onclick="closeInfoPanel()">✕</button>
      </div>
      <ul class="info-panel-list">
        ${notes.map(n => `<li>${n}</li>`).join('')}
      </ul>
    </div>
  `;
  document.querySelector('.pdf-section-header').appendChild(panel);

  const list = document.getElementById('pdf-items');
  list.innerHTML = '';

  pdfs.forEach((pdf, index) => {
    const isFav    = getFavorites().includes('pdf/' + pdf.file);
    const typeBadge = getPdfTypeBadgeHTML(pdf.pdfType);
    const div = document.createElement('div');
    div.className = 'pdf-item animate-in';
    div.innerHTML = `
      <div class="pdf-top-row">
        <div class="pdf-file-icon"><span>PDF</span></div>
        <div class="pdf-info">
          <div class="pdf-name"><span class="pdf-number">${index + 1}.</span> ${pdf.name}</div>
          <div class="pdf-meta">Fayl adı: ${pdf.file} ${typeBadge}</div>
        </div>
      </div>
      <div class="pdf-actions">
        <button class="fav-btn ${isFav ? 'active' : ''}"
          onclick="toggleFavorite('pdf/${pdf.file}', this)"
          title="Seçilmişlərə əlavə et">
          ${isFav ? '★' : '☆'}
        </button>
        <button class="pdf-open-btn" data-url="/pdf/${pdf.file}" data-file="${pdf.file}" data-action="open">
          ↗ ${t.openPdf}
        </button>
        <button class="pdf-download-btn" data-url="/pdf/${pdf.file}" data-file="${pdf.file}" data-action="download">
          ↓ ${t.downloadPdf}
        </button>
      </div>
    `;
    list.appendChild(div);
  });

  const reportBtn = document.createElement('button');
  reportBtn.className = 'report-error-btn';
  reportBtn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="8" cy="8" r="7"/>
      <line x1="8" y1="5" x2="8" y2="8.5"/>
      <circle cx="8" cy="11.5" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
    Xəta Göndər
  `;
  reportBtn.onclick = () => openReportModal(subjectName, currentCourse);
  list.appendChild(reportBtn);

  goTo('pdfs');
}

// ── Sevimlilər ────────────────────────────────────────────────
function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

function toggleFavorite(filePath, btn) {
  let favs = getFavorites();
  if (favs.includes(filePath)) {
    favs = favs.filter(f => f !== filePath);
    if (btn) { btn.textContent = '☆'; btn.classList.remove('active'); }
  } else {
    favs.push(filePath);
    if (btn) { btn.textContent = '★'; btn.classList.add('active'); }
  }
  localStorage.setItem("favorites", JSON.stringify(favs));
}

// ── Xəta Bildiriş Modal ───────────────────────────────────────
let reportSubjectName = '';
let reportCourseName  = '';

function openReportModal(subjectName, courseName) {
  reportSubjectName = subjectName;
  reportCourseName  = courseName;

  const overlay  = document.getElementById('reportOverlay');
  const ctx      = document.getElementById('report-context');
  const form     = document.getElementById('report-form');
  const success  = document.getElementById('report-success');
  const textarea = document.getElementById('report-message');
  const select   = document.getElementById('report-type');

  if (ctx)      ctx.textContent      = `${courseName} · ${subjectName}`;
  if (form)     form.classList.remove('hidden');
  if (success)  success.classList.add('hidden');
  if (textarea) textarea.value       = '';
  if (select)   select.selectedIndex = 0;

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeReportModal() {
  document.getElementById('reportOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function closeReportIfOutside(e) {
  if (e.target === document.getElementById('reportOverlay')) closeReportModal();
}

async function sendReport() {
  const type    = document.getElementById('report-type').value;
  const message = document.getElementById('report-message').value.trim();
  const sendBtn = document.getElementById('report-send-btn');

  if (!message) {
    document.getElementById('report-message').focus();
    return;
  }

  sendBtn.disabled    = true;
  sendBtn.textContent = 'Göndərilir...';

  try {
    const response = await fetch('https://formspree.io/f/xjgjrkyz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "Kurs":      reportCourseName,
        "Fənn":      reportSubjectName,
        "Xəta növü": type,
        "Məzmun":    message
      })
    });

    if (response.ok) {
      document.getElementById('report-form').classList.add('hidden');
      document.getElementById('report-success').classList.remove('hidden');
      setTimeout(closeReportModal, 2800);
    } else {
      throw new Error('Formspree error');
    }
  } catch (err) {
    const body = encodeURIComponent(
      `Kurs: ${reportCourseName}\nFənn: ${reportSubjectName}\nXəta növü: ${type}\n\n${message}`
    );
    window.open(`mailto:ericismyhero2467@gmail.com?subject=UNEC%20X%C9%99ta%20Bildiri%C5%9Fi&body=${body}`, '_blank');
    closeReportModal();
  } finally {
    sendBtn.disabled  = false;
    sendBtn.innerHTML = '↗ Göndər';
  }
}

// ── Məlumat Paneli ────────────────────────────────────────────
function toggleInfoPanel() {
  const panel = document.getElementById('subject-info-panel');
  if (panel) panel.classList.toggle('hidden');
}

function closeInfoPanel() {
  const panel = document.getElementById('subject-info-panel');
  if (panel) panel.classList.add('hidden');
}

document.addEventListener('click', function(e) {
  const panel = document.getElementById('subject-info-panel');
  if (panel && !panel.classList.contains('hidden') &&
      !panel.contains(e.target) &&
      !e.target.closest('.info-btn')) {
    panel.classList.add('hidden');
  }
});

// ── Easter Egg ────────────────────────────────────────────────
let easterClickCount = 0;
let easterTimer = null;

function easterEggClick() {
  easterClickCount++;
  clearTimeout(easterTimer);
  easterTimer = setTimeout(() => { easterClickCount = 0; }, 2000);
  if (easterClickCount >= 3) {
    easterClickCount = 0;
    clearTimeout(easterTimer);
    openEaster();
  }
}

function openEaster() {
  document.getElementById('easterOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeEaster() {
  document.getElementById('easterOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function closeEasterIfOutside(e) {
  if (e.target === document.getElementById('easterOverlay')) closeEaster();
}

// ── Təşəkkürlər Modali ────────────────────────────────────────
function openThanks() {
  renderThanks();
  document.getElementById('thanksOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeThanks() {
  document.getElementById('thanksOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function closeThanksIfOutside(e) {
  if (e.target === document.getElementById('thanksOverlay')) closeThanks();
}

// ── Klaviatura — ESC ──────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeThanks();
    closeEaster();
    closeReportModal();
    closeSidebar();
    closeAboutModal();
    closePrivacyModal();
    closeTermsModal();
  }
});

// ── Sidebar ───────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const btn     = document.getElementById('hamburgerBtn');
  if (sidebar.classList.contains('is-open')) {
    closeSidebar();
  } else {
    sidebar.classList.add('is-open');
    overlay.classList.add('active');
    btn.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('is-open');
  document.getElementById('sidebarOverlay').classList.remove('active');
  document.getElementById('hamburgerBtn').classList.remove('is-open');
  document.body.style.overflow = '';
}

// ── About ──────────────────────────────────────────────────────
function openAboutModal() {
  closeSidebar();
  document.getElementById('aboutOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeAboutModal() {
  document.getElementById('aboutOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Privacy ────────────────────────────────────────────────────
function openPrivacyModal() {
  closeSidebar();
  document.getElementById('privacyOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePrivacyModal() {
  document.getElementById('privacyOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Terms ──────────────────────────────────────────────────────
function openTermsModal() {
  closeSidebar();
  document.getElementById('termsOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeTermsModal() {
  document.getElementById('termsOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Bottom Nav Tab Sistemi ────────────────────────────────────
const TAB_MAP = {
  home:    { main: 'main-home',    btn: 'btn-home'    },
  tests:   { main: 'main-tests',   btn: 'btn-tests'   },
  courses: { main: 'main-courses', btn: 'btn-courses' },
  support: { main: 'main-support', btn: 'btn-support' },
  gpa:     { main: 'main-gpa',     btn: 'btn-gpa'     },
};

let currentBottomTab = 'home';

function switchBottomTab(tab) {
  if (currentBottomTab === tab) return;
  if (!TAB_MAP[tab]) return;

  const prev   = TAB_MAP[currentBottomTab];
  const prevEl = prev ? document.getElementById(prev.main) : null;
  if (prevEl) {
    prevEl.classList.remove('active-tab');
    setTimeout(() => { prevEl.style.display = 'none'; }, 280);
  }
  const prevBtn = prev ? document.getElementById(prev.btn) : null;
  if (prevBtn) prevBtn.classList.remove('active');

  currentBottomTab = tab;
  const next   = TAB_MAP[tab];
  const nextEl = document.getElementById(next.main);
  if (nextEl) {
    nextEl.style.display = '';
    requestAnimationFrame(() => requestAnimationFrame(() => nextEl.classList.add('active-tab')));
  }
  const nextBtn = document.getElementById(next.btn);
  if (nextBtn) nextBtn.classList.add('active');

  if (tab === 'courses') {
    renderCourses();
    goTo('home');
  }
  if (tab === 'tests') {
    initTestSystem();
  }
  if (tab === 'gpa') {
    if (typeof initGPA === 'function') initGPA();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Başlanğıc vəziyyəti (initBottomNav) ──────────────────────
(function initBottomNav() {
  const homeEl = document.getElementById('main-home');
  if (homeEl) { homeEl.style.display = ''; homeEl.classList.add('active-tab'); }
  ['main-courses', 'main-support', 'main-tests', 'main-gpa'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const homeBtn = document.getElementById('btn-home');
  if (homeBtn) homeBtn.classList.add('active');
})();

// ── Başlanğıc ─────────────────────────────────────────────────
computeStats();
applyTranslations();
renderCourses();
initSearch();
