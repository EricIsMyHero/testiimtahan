// ============================================================
// PDF-LOADER.JS  —  v2.2  (Production)
// ============================================================
// Düzəlişlər (v2.1):
//   • CORRECT_CHARS: ☑ (U+2611) və digər "düzgün" simvollar əlavə edildi
//   • Başlıq sətri problemi həll edildi: ilk QNUM-a qədər bütün sətrlər atlanır
// Düzəlişlər (v2.0):
//   • Blok bölücü sadələşdirildi: QNUM + seenSymbol, böyük hərf şərti silindi
//   • Tək rəqəmli suallar düzgün tanınır, Format C siyahısı bölünmür
// Düzəlişlər (v1.9):
//   • Blok bölücü yeniləndi: tək rəqəmli suallar (1-9) artıq düzgün tanınır
//   • Böyük hərf yoxlaması: Format C siyahısı ilə sual nömrəsi fərqləndirilir
//   • seenSymbol flag: sual bitənə qədər növbəti blok başlamır
// Düzəlişlər (v1.8):
//   • Sütun aşkarlaması: X boşluq analizi ilə 1 vs 2 sütun
//   • İki sütunlu PDF-lərdə sol sütun → sağ sütun ardıcıllığı
//   • _detectColumns, _buildLinesFromItems ayrıldı
// ============================================================

// ── Qlobal QUESTION_BANK (əgər hələ yoxdursa) ────────────────
if (typeof QUESTION_BANK === 'undefined') {
  window.QUESTION_BANK = {};
}

// ── pdf.js worker yolu ────────────────────────────────────────
(function setPdfWorker() {
  if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }
})();

// ============================================================
// 1. PDF-dən tam mətn çıxar  (koordinat əsaslı)
// ============================================================

// ── 1a. Sütun aşkarlaması ────────────────────────────────────
// PDF-də bəzən iki sütunlu layout olur: sol sütun – sual mətni,
// sağ sütun – cavab açarı və ya başqa sualın mətni.
// Eyni Y koordinatında iki fərqli sütunun mətni birləşərsə,
// parsing xəta verir. Bu funksiya X paylanmasına baxaraq
// sütunları aşkarlayır.
//
// Qayda: X qiymətlərini sıralayıb ardıcıl elementlər arasındakı
// boşluqlara baxırıq. Ən böyük boşluq > səhifə eninin 15%-i
// olduqda iki sütun var deyirik.
function _detectColumns(tagged, pageWidth) {
  if (!pageWidth || tagged.length < 6) return null;

  const xs = tagged.map(t => t.x).sort((a, b) => a - b);
  let maxGap = 0, splitX = -1;

  for (let i = 1; i < xs.length; i++) {
    const gap = xs[i] - xs[i - 1];
    if (gap > maxGap) { maxGap = gap; splitX = (xs[i - 1] + xs[i]) / 2; }
  }

  // Boşluq səhifə eninin 15%-dən böyükdürsə → iki sütun
  return maxGap > pageWidth * 0.25 ? splitX : null;
}

// ── 1b. Bir sütunun items-ini sətirləre çevir ─────────────────
function _buildLinesFromItems(items) {
  if (!items.length) return [];

  const Y_TOLERANCE = 5;
  const lineGroups  = [];

  // Y azalan (üst sətir əvvəl), eyni Y-də X artan
  const sorted = [...items].sort((a, b) => {
    const dy = b.y - a.y;
    if (Math.abs(dy) > 4) return dy;
    return a.x - b.x;
  });

  for (const item of sorted) {
    const existing = lineGroups.find(g => Math.abs(g.y - item.y) <= Y_TOLERANCE);
    if (existing) {
      existing.parts.push(item);
    } else {
      lineGroups.push({ y: item.y, parts: [item] });
    }
  }

  lineGroups.sort((a, b) => b.y - a.y);

  return lineGroups.map(group => {
    group.parts.sort((a, b) => a.x - b.x);

    let result = '';
    for (let i = 0; i < group.parts.length; i++) {
      const cur  = group.parts[i];
      const prev = group.parts[i - 1];

      if (i === 0) { result += cur.str; continue; }

      const gap      = cur.x - (prev.x + prev.width);
      const avgCharW = prev.width / (prev.str.length || 1);
      const needsSp  = gap > avgCharW * 0.3;

      result += (needsSp && !result.endsWith(' ') ? ' ' : '') + cur.str;
    }
    return result.trim();
  }).filter(Boolean);
}

// ── 1c. Ana sətir qurucusu (sütun-aware) ─────────────────────
// Əgər iki sütun aşkarlanırsa: sol sütun üst-aşağı, sonra sağ
// sütun üst-aşağı işlənir. Tək sütunda birbaşa işlənir.
function _rebuildPageLines(items, pageWidth) {
  const valid = items.filter(item => item.str && item.str.trim() !== '');
  if (!valid.length) return [];

  const tagged = valid.map(item => ({
    str  : item.str,
    x    : item.transform[4],
    y    : item.transform[5],
    width: item.width || 0,
  }));

  const splitX = _detectColumns(tagged, pageWidth);

  if (splitX !== null) {
    // İki sütun: sol → sağ
    const left  = tagged.filter(t => t.x < splitX);
    const right = tagged.filter(t => t.x >= splitX);
    return [
      ..._buildLinesFromItems(left),
      ..._buildLinesFromItems(right),
    ];
  }

  // Tək sütun
  return _buildLinesFromItems(tagged);
}

// ── 1b. Orphan simvol normalizasiyası ────────────────────────
// pdf.js bəzən "•" və ya "√" simvolunu ayrı item kimi qaytarır,
// növbəti sətirdə isə variantın mətni gəlir.
// Əgər sətir yalnız simvoldan ibarətdirsə VƏ növbəti sətir
// simvolsuz başlayırsa → ikisini birləşdir.
function _mergeOrphanSymbols(lines) {
  const LONE_SYMBOL = /^[\u2022\u221A\u25CF\u25AA\u25A0\u25C6•√●▪■◆✓✔]\s*$/;
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    if (LONE_SYMBOL.test(lines[i]) && i + 1 < lines.length) {
      result.push(lines[i].trim() + ' ' + lines[i + 1].trim());
      i++;
    } else {
      result.push(lines[i]);
    }
  }
  return result;
}

// ── 1c. Ana funksiya ──────────────────────────────────────────
async function extractPdfText(url) {
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('[pdf-loader] pdfjsLib tapılmadı. HTML-ə pdf.js CDN əlavə edin.');
  }

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument(url).promise;
  } catch (err) {
    throw new Error(`[pdf-loader] PDF yüklənmədi (${url}): ${err.message}`);
  }

  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    try {
      const page    = await pdf.getPage(pageNum);
      const content  = await page.getTextContent();
      const viewport  = page.getViewport({ scale: 1 });
      const pageWidth = viewport.width;

      const rawLines   = _rebuildPageLines(content.items, pageWidth);
      const cleanLines = _mergeOrphanSymbols(rawLines);

      fullText += cleanLines.join('\n') + '\n';
    } catch (pageErr) {
      console.warn(`[pdf-loader] Səhifə ${pageNum} oxunmadı:`, pageErr.message);
    }
  }

  return fullText;
}

// ============================================================
// 2. Mətnden sualları parse et
// ============================================================

// ── Sabitlər ─────────────────────────────────────────────────
// Format A/C: simvol əsaslı variant işarələri
// Düzgün cavab işarələri (√ ✓ ✔ ☑ və oxşarları)
const CORRECT_CHARS  = /^[\u221A\u2713\u2714\u2611\u2612√✓✔☑]/;
// Bütün variant simvolları (• ● ▪ ■ ◆ + düzgün cavab simvolları)
const SYMBOL_OPTION  = /^[\u2022\u221A\u2713\u2714\u2611\u2612\u25CF\u25AA\u25A0\u25C6•√✓✔☑●▪■◆]\s*/;

// ──────────────────────────────────────────────────────────────
// FORMATLAR:
//
//  Format A — Sadə simvol variantları:
//    157. Sual mətni
//    • Variant 1
//    √ Düzgün variant
//    • Variant 3
//
//  Format C — Kombinasiya sualı (siyahı + simvol cavablar):
//    158. Sual mətni:
//    1. Birinci şərt
//    2. İkinci şərt
//    3. Üçüncü şərt
//    √ 2.3;        ← düzgün cavab (kombinasiya)
//    • 3.4;
//    • 1.4;
//
//  Format C-ni Format A-dan fərqləndirmək:
//    → Blok içində həm rəqəmli siyahı (1. 2. 3.) HƏM də simvol
//      variantları (• √) varsa → Format C
//    → Yalnız simvol variantları varsa → Format A
// ──────────────────────────────────────────────────────────────

function parseQuestionsFromText(text) {
  const questions = [];

  const normalised = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g,   '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

  // ── Blok bölmə ───────────────────────────────────────────
  // Sual nömrəsi: ≥2 rəqəm + nöqtə + boşluq  (10. 11. ... 100. ...)
  // VEYA tək rəqəm + nöqtə amma bu bir sual nömrəsi ola bilər.
  // Güvənli qayda: ≥2 rəqəmli nömrələr həmişə sual nömrəsidir.
  // Tək rəqəmli (1–9) nömrələri blok ayırıcı ETMƏYƏK — bunlar
  // Format C-nin siyahı elementləridir.
  // ── Blok bölmə məntiqi ───────────────────────────────────────
  // Sual nömrəsi: istənilən rəqəm + ". " (1. 2. ... 10. 100.)
  // Format C siyahısından fərq: blok yalnız əvvəlki blokda ən
  // azı bir simvol variant (• √) görüldükdən SONRA bölünür.
  // Bu sayədə:
  //  • Tək rəqəmli suallar (1–9) düzgün tanınır
  //  • Format C siyahı elementləri (1. 2. 3.) sual kimi bölünmür
  //  • Çox sətirli sual mətni sehvən bölünmür
  const QNUM = /^\d+\.\s+/;   // sual nömrəsi prefiksi

  const allLines = normalised.split('\n');
  const questionBlocks = [];
  let   currentBlock   = [];
  let   seenSymbol     = false;

  // İlk sual tapılana qədər başlıq sətrlərini atla
  let foundFirstQuestion = false;

  for (const line of allLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isQNum = QNUM.test(trimmed);

    if (!foundFirstQuestion) {
      // Hələ ilk suala çatmamışıq — yalnız QNUM sətri ilk sualdır
      if (isQNum) {
        foundFirstQuestion = true;
        currentBlock = [trimmed];
      }
      // Başlıq sətrlərini (PDF adı, fənn adı və s.) atla
      continue;
    }

    if (isQNum && seenSymbol) {
      // Əvvəlki blokda variant simvolu görülüb → yeni sual başlayır
      if (currentBlock.length) questionBlocks.push(currentBlock.join('\n'));
      currentBlock = [trimmed];
      seenSymbol   = false;
    } else {
      currentBlock.push(trimmed);
      if (SYMBOL_OPTION.test(trimmed)) seenSymbol = true;
    }
  }
  if (currentBlock.length) questionBlocks.push(currentBlock.join('\n'));

  const filteredBlocks = questionBlocks.map(b => b.trim()).filter(Boolean);

  filteredBlocks.forEach((block, blockIdx) => {
    const lines = block
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      console.warn(`[pdf-loader] Blok ${blockIdx + 1} çox qısadır, keçilir:`, block.slice(0, 60));
      return;
    }

    // Format müəyyən et
    const hasSymbol  = lines.some(l => SYMBOL_OPTION.test(l));
    const hasNumList = lines.some(l => /^[1-9]\.\s+\S/.test(l));

    if (!hasSymbol) {
      // Simvol yoxdur — bu blok tanınmır (başlıq sətri ola bilər)
      console.warn(`[pdf-loader] Blok ${blockIdx + 1}-də variant tapılmadı, keçilir.`);
      return;
    }

    if (hasSymbol && hasNumList) {
      // Format C: siyahı + simvol cavablar
      _parseFormatC(lines, blockIdx, questions);
    } else {
      // Format A: yalnız simvol variantlar
      _parseFormatA(lines, blockIdx, questions);
    }
  });

  return questions;
}

// ── Format A Parser ───────────────────────────────────────────
// 157. Sual mətni
// • Variant 1
// √ Düzgün variant     ← düzgün cavab
// • Variant 3
function _parseFormatA(lines, blockIdx, questions) {
  let questionLines  = [];
  let optionStartIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^[\u221A√✓✔]\s*$/.test(lines[i])) { // orphan √
      optionStartIdx = i; break;
    }
    if (SYMBOL_OPTION.test(lines[i])) {
      optionStartIdx = i; break;
    }
    questionLines.push(lines[i]);
  }

  if (optionStartIdx === -1 || questionLines.length === 0) {
    console.warn(`[pdf-loader] FormatA Blok ${blockIdx + 1}: variant tapılmadı, keçilir.`);
    return;
  }

  const questionText = questionLines.join(' ').replace(/^\d+\.\s*/, '').trim();
  if (!questionText) return;

  const options       = [];
  let   correctAnswer = -1;
  let   nextIsCorrect = false;

  for (let i = optionStartIdx; i < lines.length; i++) {
    const line = lines[i];

    // Orphan √ — tək simvol sətri: növbəti sətir düzgün cavab olacaq
    if (/^[\u221A√✓✔]\s*$/.test(line)) {
      nextIsCorrect = true;
      continue;
    }

    const isCorrect = nextIsCorrect || CORRECT_CHARS.test(line);
    const isOption  = SYMBOL_OPTION.test(line);
    nextIsCorrect   = false;

    // Növbəti sualın başlanğıcı → bu blok bitdi
    if (/^\d+\.\s+\S/.test(line) && !SYMBOL_OPTION.test(line)) break;

    if (!isOption) {
      // Bu sətir simvol prefiksi olmayan mətndir.
      // Əgər isCorrect=true (orphan √-dan gəlir) → bu sətir √-ın mətn
      // hissəsidir → yeni option kimi əlavə et və correctAnswer set et.
      // Əgər isCorrect=false → əvvəlki optionun davamıdır.
      if (isCorrect && options.length >= 0) {
        // √ + ayrı sətir mətn: yeni option
        options.push(line.trim());
        correctAnswer = options.length - 1;
      } else if (options.length > 0) {
        options[options.length - 1] += ' ' + line;
      }
      continue;
    }

    const clean = line.replace(/^[\u2022\u221A\u25CF\u25AA\u25A0\u25C6•√●▪■◆✓✔]\s*/, '').trim();
    if (!clean) continue;

    options.push(clean);
    if (isCorrect) correctAnswer = options.length - 1;
  }

  if (options.length < 2) {
    console.warn(`[pdf-loader] FormatA "${questionText.slice(0, 40)}…" — variant sayı azdır, keçilir.`);
    return;
  }
  if (correctAnswer === -1) {
    console.warn(`[pdf-loader] "${questionText.slice(0, 40)}…" — düzgün cavab tapılmadı. answer=-1.`);
  }

  questions.push({ question: questionText, options, answer: correctAnswer });
}

// ── Format C Parser ───────────────────────────────────────────
// 158. Sual mətni:
// 1. Birinci şərt          ← bunlar sual məzmununun siyahısıdır,
// 2. İkinci şərt              variant DEYİL
// 3. Üçüncü şərt
// √ 2.3;                   ← bu əsl variant (düzgün cavab)
// • 3.4;
// • 1.4;
function _parseFormatC(lines, blockIdx, questions) {
  // Simvol variantlarının başlandığı nöqtəni tap
  let symStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (SYMBOL_OPTION.test(lines[i]) || /^[\u221A√✓✔]\s*$/.test(lines[i])) {
      symStart = i;
      break;
    }
  }

  if (symStart === -1) {
    console.warn(`[pdf-loader] FormatC Blok ${blockIdx + 1}: simvol variant tapılmadı.`);
    return;
  }

  // Sual mətni: 0-dan symStart-a qədər (rəqəmli siyahı daxil)
  // Sual nömrəsini çıxar, siyahını sual mətninə daxil et
  const questionText = lines.slice(0, symStart)
    .join(' ')
    .replace(/^\d+\.\s*/, '')
    .trim();

  if (!questionText) return;

  // Simvol variantları parse et (Format A ilə eyni məntiq)
  const options       = [];
  let   correctAnswer = -1;
  let   nextIsCorrect = false;

  for (let i = symStart; i < lines.length; i++) {
    const line = lines[i];

    if (/^[\u221A√✓✔]\s*$/.test(line)) {
      nextIsCorrect = true;
      continue;
    }

    const isCorrect = nextIsCorrect || CORRECT_CHARS.test(line);
    const isOption  = SYMBOL_OPTION.test(line);
    nextIsCorrect   = false;

    // Növbəti sualın başlanğıcı → bu blok bitdi
    if (/^\d+\.\s+\S/.test(line) && !SYMBOL_OPTION.test(line)) break;

    if (!isOption) {
      if (isCorrect && options.length >= 0) {
        options.push(line.trim());
        correctAnswer = options.length - 1;
      } else if (options.length > 0) {
        options[options.length - 1] += ' ' + line;
      }
      continue;
    }

    const clean = line.replace(/^[\u2022\u221A\u25CF\u25AA\u25A0\u25C6•√●▪■◆✓✔]\s*/, '').trim();
    if (!clean) continue;

    options.push(clean);
    if (isCorrect) correctAnswer = options.length - 1;
  }

  if (options.length < 2) {
    console.warn(`[pdf-loader] FormatC "${questionText.slice(0, 40)}…" — variant sayı azdır, keçilir.`);
    return;
  }
  if (correctAnswer === -1) {
    console.warn(`[pdf-loader] FormatC "${questionText.slice(0, 40)}…" — düzgün cavab tapılmadı. answer=-1.`);
  }

  questions.push({ question: questionText, options, answer: correctAnswer });
}

// ============================================================
// 3. Bir PDF yüklə və QUESTION_BANK-a yaz
// ============================================================
async function loadQuestionsFromPDF(url, subjectName) {
  console.info(`[pdf-loader] "${subjectName}" yüklənir: ${url}`);

  let text;
  try {
    text = await extractPdfText(url);
  } catch (err) {
    console.error(`[pdf-loader] "${subjectName}" üçün PDF oxunmadı:`, err.message);
    QUESTION_BANK[subjectName] = [];
    return;
  }

  const parsed = parseQuestionsFromText(text);

  // ── Yanlış parse edilmiş sualları filtrə et ───────────────
  // Bəzən PDF-də sual nömrəsi ayrı sətirdə render olunur.
  // Nəticədə qırıq bloklar yaranır: sual mətni ya çox qısadır,
  // ya da rəqəm+nöqtə ilə başlayan siyahı elementi olur.
  // Bu sualları buraxırıq.
  const MIN_QUESTION_LENGTH = 15;
  const valid = parsed.filter(q => {
    const t = q.question.trim();
    if (t.length < MIN_QUESTION_LENGTH) {
      console.warn(`[pdf-loader] Çox qısa sual atlandı: "${t}"`);
      return false;
    }
    if (q.answer === -1) {
      console.warn(`[pdf-loader] Düzgün cavabsız sual atlandı: "${t.slice(0, 40)}…"`);
      return false;
    }
    return true;
  });

  QUESTION_BANK[subjectName] = valid;

  const filteredOut = parsed.length - valid.length;
  console.info(
    `[pdf-loader] "${subjectName}" tamamlandı: ` +
    `${valid.length} sual` +
    (filteredOut ? ` | ${filteredOut} qırıq` : '')
  );
}

// ============================================================
// 4. subjects.json-dan bütün fənləri avtomatik yüklə
// ============================================================
const PdfLoadingUI = {
  _el: null,
  _fill: null,
  _title: null,
  _interval: null,
  _progress: 0,

  show(message) {
    this._el    = this._el    || document.getElementById('pdfLoadingOverlay');
    this._fill  = this._fill  || document.getElementById('pdfProgressFill');
    this._title = this._title || document.getElementById('pdfLoadingTitle');

    if (!this._el) return;

    if (this._title) this._title.textContent = message || 'Suallar Yüklənir...';
    if (this._fill)  this._fill.style.width  = '0%';
    this._el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    this._progress = 0;
    clearInterval(this._interval);
    this._interval = setInterval(() => {
      if (this._progress < 85) {
        this._progress = Math.min(this._progress + 5, 85);
        if (this._fill) this._fill.style.width = this._progress + '%';
      }
    }, 200);
  },

  update(message, pct) {
    if (this._title) this._title.textContent = message;
    if (this._fill && pct !== undefined) {
      clearInterval(this._interval);
      this._fill.style.width = Math.min(pct, 95) + '%';
    }
  },

  hide() {
    clearInterval(this._interval);
    if (this._fill) this._fill.style.width = '100%';
    setTimeout(() => {
      if (this._el)  this._el.classList.add('hidden');
      if (this._fill) this._fill.style.width = '5%';
      document.body.style.overflow = '';
    }, 400);
  }
};

async function autoLoadAllSubjects(subjectsUrl) {
  subjectsUrl = subjectsUrl || './data/subjects.json';

  PdfLoadingUI.show('Fənlər Yüklənir...');

  let subjects;
  try {
    const res = await fetch(subjectsUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    subjects = await res.json();
  } catch (err) {
    console.error('[pdf-loader] subjects.json oxunmadı:', err.message);
    PdfLoadingUI.hide();
    if (typeof renderTestSubjects === 'function') renderTestSubjects();
    return;
  }

  const entries = Object.entries(subjects);
  if (!entries.length) {
    console.warn('[pdf-loader] subjects.json boşdur.');
    PdfLoadingUI.hide();
    if (typeof renderTestSubjects === 'function') renderTestSubjects();
    return;
  }

  for (let i = 0; i < entries.length; i++) {
    const [name, pdfUrl] = entries[i];
    const pct            = Math.round(((i + 1) / entries.length) * 90);

    PdfLoadingUI.update(
      `"${name}" yüklənir… (${i + 1}/${entries.length})`,
      pct
    );

    await loadQuestionsFromPDF(pdfUrl, name);
  }

  PdfLoadingUI.hide();

  const totalQ = Object.values(QUESTION_BANK)
    .reduce((sum, arr) => sum + arr.length, 0);

  console.info(
    `[pdf-loader] Bütün fənlər yükləndi. ` +
    `Cəmi: ${Object.keys(QUESTION_BANK).length} fənn, ${totalQ} sual.`
  );

  if (typeof renderTestSubjects === 'function') {
    renderTestSubjects();
  } else {
    console.warn('[pdf-loader] renderTestSubjects() tapılmadı.');
  }
}

// ============================================================
// 5. Avtomatik başlat  (DOMContentLoaded)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  window.initTestSystem = function () {
    if (testState && testState.initialized) return;
    if (typeof testState !== 'undefined') testState.initialized = true;
    autoLoadAllSubjects();
  };

  if (typeof testState !== 'undefined' && testState.initialized) {
    autoLoadAllSubjects();
  }
});

// ============================================================
// 6. Debug yardımçısı  (brauzer konsolundan çağırmaq üçün)
// ============================================================
// İstifadə: window.debugPdf('./pdf/maliyyeQ26.pdf', 1)
//   → 1-ci səhifənin extraction nəticəsini konsola yazır
window.debugPdf = async function (url, pageNum = 1) {
  if (typeof pdfjsLib === 'undefined') {
    console.error('[debugPdf] pdfjsLib yoxdur');
    return;
  }
  const pdf      = await pdfjsLib.getDocument(url).promise;
  const page     = await pdf.getPage(pageNum);
  const content  = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });

  console.group(`[debugPdf] ${url} — Səhifə ${pageNum}  (${viewport.width.toFixed(0)}×${viewport.height.toFixed(0)})`);
  console.log('Raw items:', content.items.length);

  const rawLines   = _rebuildPageLines(content.items, viewport.width);
  const cleanLines = _mergeOrphanSymbols(rawLines);

  console.log('Lines after rebuild:', cleanLines.length);
  cleanLines.forEach((l, i) => console.log(`  ${String(i + 1).padStart(3, ' ')}: ${l}`));
  console.groupEnd();

  return cleanLines;
};
