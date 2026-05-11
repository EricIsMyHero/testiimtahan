// ============================================================
// DATA-UTILS.JS
// İçindəkilər:
// - İmtahan tipinə görə avtomatik qeydlər (EXAM_NOTES)
// - Təşəkkürlər data (thanksData)
// - Fənn tipi badge-i (getTypeBadgeHTML)
// - PDF tipi badge-i (getPdfTypeBadgeHTML)
// - Tərcümə sistemi (translations, setLang, applyTranslations)
// - Tema sistemi (themes, applyTheme)
// - Statistika (computeStats)
// ============================================================

// ── İmtahan tipinə görə avtomatik qeydlər ───────────────────
const EXAM_NOTES = {
  test: [
    "🖥️ Bu fənn <strong>Elektron-Test</strong> formatındadır.",
    "🔀 Sualların sırası fərqli ola bilər. Cavabları sıraya görə deyil, mənaya görə öyrənin.",
    "⚠️ Materiallardakı cavablar köhnə ola bilər, müəllimin dediyi mövzularla müqayisə edin.",
    "💡 Bütün variantları nəzərdən keçirin, bəzən test tipli fənnlər yazılıya çevrilə bilər."
  ],
  yazili: [
    "✍️ Bu fənn <strong>Elektron-Yazılı</strong> formatındadır.",
    "📝 Cavablarınızı tam, əsaslandırılmış və ən önəmlisi fərqli şəkildə yazmağa diqqət göstərin.",
    "⚠️ Materiallardakı suallar köhnə ola bilər, sillabusunuzla mütləq uyğunlaşdırın.",
    "💡 Əlavə mənbələrdən də istifadə etməyi tövsiyə edirik, bəzən yazılı tipli fənnlər testə çevrilə bilər."
  ]
};

// ── Təşəkkürlər data ─────────────────────────────────────────
const thanksData = [
  { name: "Nərimanov Elnur",  initial: "E", role: "code" },
  { name: "Şükürova Güləyar", initial: "G", role: "pdf"  },
  { name: "Hacıyev Tofiq",    initial: "T", role: "pdf"  },
  { name: "İslamlı Həsən",    initial: "H", role: "pdf"  },
  { name: "Həsənli Əsmər",    initial: "Ə", role: "pdf"  },
];

function renderThanks() {
  const ul = document.getElementById('thanks-list');
  if (!ul) return;
  ul.innerHTML = '';
  const groups = [
    { key: 'code', label: '💻 Kod töhfəçiləri' },
    { key: 'pdf',  label: '📄 PDF töhfəçiləri' }
  ];
  groups.forEach(group => {
    const people = thanksData.filter(p => p.role === group.key);
    if (people.length === 0) return;
    const header = document.createElement('li');
    header.className = 'thanks-section-label';
    header.textContent = group.label;
    ul.appendChild(header);
    people.forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="thanks-avatar">${p.initial}</span>
        <div class="thanks-person"><span class="thanks-name">${p.name}</span></div>
        <span class="thanks-heart">♥</span>
      `;
      ul.appendChild(li);
    });
  });
}

// ── Fənn tipi badge-i ────────────────────────────────────────
function getTypeBadgeHTML(type) {
  if (type === 'test')   return `<span class="exam-type-badge exam-type-test">🖥️ Test</span>`;
  if (type === 'yazili') return `<span class="exam-type-badge exam-type-yazili">✍️ Yazılı</span>`;
  return '';
}

// ── PDF tipi badge-i ─────────────────────────────────────────
function getPdfTypeBadgeHTML(pdfType) {
  if (!pdfType || !PDF_TYPES[pdfType]) return '';
  const t = PDF_TYPES[pdfType];
  return `<span class="pdf-type-badge" style="color:${t.color};background:${t.bg};border-color:${t.border}">${t.label}</span>`;
}

// ── Tema sistemi ─────────────────────────────────────────────
const themes = {
  ocean:    { '--bg':'#070d1a','--surface':'#0d1a2e','--surface2':'#122240','--accent':'#3b82f6','--accent2':'#06b6d4','--accent3':'#8b5cf6','--text':'#e2e8f0','--muted':'#64748b','--border':'rgba(59,130,246,0.15)','--glow':'rgba(59,130,246,0.08)' },
  forest:   { '--bg':'#071a0d','--surface':'#0d2e1a','--surface2':'#124022','--accent':'#22c55e','--accent2':'#4ade80','--accent3':'#86efac','--text':'#e2e8f0','--muted':'#6b7280','--border':'rgba(34,197,94,0.15)','--glow':'rgba(34,197,94,0.08)' },
  sunset:   { '--bg':'#1a0a07','--surface':'#2e150d','--surface2':'#402012','--accent':'#f97316','--accent2':'#ec4899','--accent3':'#fbbf24','--text':'#f1e8e0','--muted':'#78716c','--border':'rgba(249,115,22,0.15)','--glow':'rgba(249,115,22,0.08)' },
  midnight: { '--bg':'#0a0a0a','--surface':'#141414','--surface2':'#1f1f1f','--accent':'#ffffff','--accent2':'#a3a3a3','--accent3':'#737373','--text':'#e5e5e5','--muted':'#525252','--border':'rgba(255,255,255,0.1)','--glow':'rgba(255,255,255,0.04)' },
  candy:    { '--bg':'#fafafa','--surface':'#ffffff','--surface2':'#f3f4f6','--accent':'#a855f7','--accent2':'#ec4899','--accent3':'#8b5cf6','--text':'#1e1b4b','--muted':'#6b7280','--border':'rgba(168,85,247,0.15)','--glow':'rgba(168,85,247,0.06)' },
  arctic:   { '--bg':'#f0f9ff','--surface':'#ffffff','--surface2':'#e0f2fe','--accent':'#0284c7','--accent2':'#0ea5e9','--accent3':'#38bdf8','--text':'#0c1a2e','--muted':'#64748b','--border':'rgba(2,132,199,0.15)','--glow':'rgba(2,132,199,0.06)' },
};

function applyTheme(name, btn) {
  const vars = themes[name];
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  localStorage.setItem('theme', name);
  document.querySelectorAll('.theme-opt, .sidebar-theme-opt').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ── Dil sistemi ──────────────────────────────────────────────
const translations = {
  az: {
    badge: "İmtahan Materialları",
    heroTitle: 'UNEC <span>İmtahan</span><br>Materialları',
    heroDesc: "Bütün kurslar üzrə imtahan materiallarına tez çatın. Fənni seçərək, PDF-i açın.",
    coursesLabel: "Kurslar",
    subjectsLabel: "Fənlər",
    extrasLabel: "Əlavələr",
    favoritesLabel: "Seçilmişlər",
    pdfsLabel: "PDF Materiallar",
    searchPlaceholder: "Fənn axtar...",
    back1: "Kurslara qayıt",
    back2: "Fənlərə qayıt",
    bcHome: "Ana səhifə",
    subjects: "fənn",
    pdfs: "material",
    openPdf: "Aç",
    downloadPdf: "Endir",
    statCourses: "Kurs",
    statSubjects: "Fənn",
    statPdfs: "PDF",
    noFavorites: "Hələ seçilən PDF yoxdur. ★ basaraq əlavə edin.",
    noExtras: "Bu kurs üçün hələ əlavə material yoxdur.",
    footer: "Bu sayt rəsmi deyildir. Yalnız tələbələrin imtahan zamanı materialları daha rahat və əlçatan tapması üçün hazırlanıb.",
    semesterFall: "🍂 Payız Semestri",
    semesterSpring: "🌸 Yaz Semestri"
  },
  en: {
    badge: "Exam Materials",
    heroTitle: 'UNEC <span>Exam</span><br>Materials',
    heroDesc: "Quick access to exam materials for all courses. Select a subject, open the PDF.",
    coursesLabel: "Courses",
    subjectsLabel: "Subjects",
    extrasLabel: "Extras",
    favoritesLabel: "Favorites",
    pdfsLabel: "PDF Materials",
    searchPlaceholder: "Search subjects...",
    back1: "Back to Courses",
    back2: "Back to Subjects",
    bcHome: "Home",
    subjects: "subjects",
    pdfs: "files",
    openPdf: "Open",
    downloadPdf: "Download",
    statCourses: "Courses",
    statSubjects: "Subjects",
    statPdfs: "PDFs",
    noFavorites: "No favorites yet. Tap ★ to add one.",
    noExtras: "No extra materials for this course yet.",
    footer: "This site is unofficial. Created to help students find exam materials more easily.",
    semesterFall: "🍂 Fall Semester",
    semesterSpring: "🌸 Spring Semester"
  }
};

let lang = localStorage.getItem('lang') || 'az';

function setLang(l) {
  lang = l;
  localStorage.setItem('lang', l);
  applyTranslations();
  const view = getCurrentView();
  if (view === 'subjects') renderSubjects(currentCourse);
  else if (view === 'home') renderCourses();
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = translations[lang].searchPlaceholder;
}

function applyTranslations() {
  const t = translations[lang];
  document.getElementById('hero-badge').textContent          = t.badge;
  document.getElementById('hero-title').innerHTML            = t.heroTitle;
  document.getElementById('hero-desc').textContent           = t.heroDesc;
  document.getElementById('label-courses').textContent       = t.coursesLabel;
  document.getElementById('label-subjects').textContent      = t.subjectsLabel;
  document.getElementById('label-extras').textContent        = t.extrasLabel;
  document.getElementById('label-favorites').textContent     = t.favoritesLabel;
  document.getElementById('label-pdfs').textContent          = t.pdfsLabel;
  document.getElementById('back1-text').textContent          = t.back1;
  document.getElementById('back2-text').textContent          = t.back2;
  document.getElementById('bc-home').textContent             = t.bcHome;
  document.getElementById('bc-home2').textContent            = t.bcHome;
  document.getElementById('stat-courses-label').textContent  = t.statCourses;
  document.getElementById('stat-subjects-label').textContent = t.statSubjects;
  document.getElementById('stat-pdfs-label').textContent     = t.statPdfs;
  document.getElementById('footer-text').textContent         = t.footer;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.lang-btn')[lang === 'az' ? 0 : 1].classList.add('active');
}

// ── Statistika ───────────────────────────────────────────────
function computeStats() {
  let totalSubjects = 0, totalPdfs = 0;
  Object.values(data).forEach(course => {
    const subs = Object.values(course.subjects);
    totalSubjects += subs.length;
    subs.forEach(subj => totalPdfs += subj.pdfs.length);
  });
  document.getElementById('stat-courses').textContent  = Object.keys(data).length;
  document.getElementById('stat-subjects').textContent = totalSubjects;
  document.getElementById('stat-pdfs').textContent     = totalPdfs;
}

// ── Tema genişlənmə ──────────────────────────────────────────
function toggleExtraThemes() {
  const extras = document.querySelectorAll('.theme-extra');
  const icon   = document.getElementById('themeExpandIcon');
  const label  = document.getElementById('themeExpandLabel');
  const isOpen = extras[0] && extras[0].classList.contains('theme-extra-visible');
  extras.forEach(el => el.classList.toggle('theme-extra-visible', !isOpen));
  if (icon)  icon.classList.toggle('rotated', !isOpen);
  if (label) label.textContent = isOpen ? 'Daha çox tema' : 'Daha az tema';
}

// ── Başlanğıc — Tema yüklə ───────────────────────────────────
(function loadSavedTheme() {
  const saved = localStorage.getItem('theme');
  if (saved && themes[saved]) {
    const btn = document.querySelector(`[data-theme="${saved}"]`);
    applyTheme(saved, btn);
  }
})();

// ── Başlanğıc — Genişlənmiş tema ────────────────────────────
(function () {
  const saved = localStorage.getItem('theme') || 'ocean';
  if (['midnight', 'candy', 'arctic'].includes(saved)) {
    document.querySelectorAll('.theme-extra').forEach(el => el.classList.add('theme-extra-visible'));
    const icon  = document.getElementById('themeExpandIcon');
    const label = document.getElementById('themeExpandLabel');
    if (icon)  icon.classList.add('rotated');
    if (label) label.textContent = 'Daha az tema';
  }
})();
