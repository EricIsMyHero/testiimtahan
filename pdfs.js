// ============================================================
// Hər fənnə mütləq "type" yazın: "test" və ya "yazili"
// Hər fənnə mütləq "semester" yazın: 1 (Payız) və ya 2 (Yaz)
// subjects altında: { type: "test", semester: 1, pdfs: [...] }
// ============================================================

const BASE = "/";
const EXTRAS_BASE = "/pdf-extra/";

const PDF_TYPES = {
  semester:  { label: "Semestr",       color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  midterm:   { label: "Kollekvium",     color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
  task:      { label: "Məsələ",        color: "#eab308", bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.3)" },
  notes:     { label: "Qeydlər",     color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
  summary:   { label: "Xülasə",      color: "#06b6d4", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.3)" },
  practice:  { label: "Praktika",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  reference: { label: "Ədəbiyyat",   color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)" },
  optional:  { label: "Əlavə",       color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)" },
  old:       { label: "Köhnə",       color: "#6b7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.3)" }
};

const data = {
  "1-ci kurs": {
    icon: "📘",
    subjects: {
      "Xətti cəbr və riyazi analiz": {
        type: "test", semester: 1, pdfs: [
          { name: "Xətti Cəbr və Riyazi Analiz Q26", file: "xcraQ26.pdf", pdfType: "semester"}
        ]
      },
      "İKT - Baza kompüter bilikləri": {
        type: "test", semester: 1, pdfs: [
          { name: "İKT - Baza Kompüter Bilikləri Q26", file: "iktQ26.pdf", pdfType: "semester"},
          { name: "İKT - Baza Kompüter Bilikləri Q25", file: "iktQ25.pdf", pdfType: "semester"}
        ]
      },
      "Azərbaycanın tarixi": {
        type: "test", semester: 1, pdfs: [
          { name: "Azərbaycanın Tarixi Q26", file: "aztarixiQ26.pdf", pdfType: "semester"}
        ]
      },
      "Karyera planlaması": {
        type: "test", semester: 1, pdfs: [
          { name: "Karyera Planlaması Q26", file: "karyeraQ26.pdf", pdfType: "semester"},
          { name: "Karyera Planlaması Q25", file: "karyeraQ25.pdf", pdfType: "semester"}
        ]
      },
      "Xarici dildə işgüzar və akademik kommunikasiya A1": {
        type: "test", semester: 1, pdfs: [
          { name: "White Death A1", file: "whitedeathA1.pdf", pdfType: "midterm"}
        ]
      },
      "Riyaziyyat-1": {
        type: "test", semester: 1, pdfs: [
          { name: "Riyaziyyat-1 Q24", file: "riyaziyyat1Q24.pdf", pdfType: "semester"}
        ]
      },
      "Hidrologiya": {
        type: "yazili", semester: 1, pdfs: [
          { name: "Hidrologiya", file: "hidrologiya1.pdf", pdfType: "semester"}
        ]
      },
      "Fizikanın əsasları": {
        type: "yazili", semester: 1, pdfs: [
          { name: "Fizikanın Əsasları", file: "fizikaninesaslarikollek1.pdf", pdfType: "midterm"}
        ]
      },
      "Ümumi kimya": {
        type: "yazili", semester: 1, pdfs: [
          { name: "Ümumi Kimya", file: "umumikimyakollek1.pdf", pdfType: "midterm"},
          { name: "Ümumi Kimya - 36-75", file: "umumikimya36-75.pdf", pdfType: "semester"}
        ]
      },
      "Ehtimal nəzəriyyəsi və riyazi statistika": {
        type: "test", semester: 2, pdfs: [
          { name: "Ehtimal Nəzəriyyəsi və Riyazi Statistika Y25", file: "enrsY25.pdf", pdfType: "semester"},
          { name: "Ehtimal Nəzəriyyəsi və Riyazi Statistika Y23", file: "enrsY23.pdf", pdfType: "semester"}
        ]
      },
      "Xarici dildə işgüzar və akademik kommunikasiya A2": {
        type: "test", semester: 2, pdfs: [
          { name: "Robinson Crusoe A2", file: "robinsoncrusoeA2.pdf", pdfType: "midterm"}
        ]
      },
      "Azərbaycan dilində işgüzar və akademik kommunikasiya": {
        type: "test", semester: 2, pdfs: [
          { name: "ADİAK Q26", file: "adiakQ26.pdf", pdfType: "semester"},
          { name: "ADİAK Y25", file: "adiakY25.pdf", pdfType: "semester"},
          { name: "ADİAK Y23", file: "adiakY23.pdf", pdfType: "semester"}
        ]
      },
      "Yumşaq bacarıqlar (Soft skills)": {
        type: "test", semester: 2, pdfs: [
          { name: "Soft Skills Y25", file: "softskillsY25.pdf", pdfType: "semester"}
        ]
      },
      "İqtisadiyyata giriş": {
        type: "yazili", semester: 2, pdfs: [
          { name: "İqtisadiyyata Giriş", file: "iqtisadiyyat1.pdf", pdfType: "semester"}
        ]
      },
      "Mülki müdafiə": {
        type: "test", semester: 2, pdfs: [
          { name: "Mülki Müdafiə Q26", file: "mulkimudafieQ26.pdf", pdfType: "semester"},
          { name: "Mülki Müdafiə Y24", file: "mulkimudafieY24.pdf", pdfType: "semester"},
          { name: "Mülki Müdafiə Q23", file: "mulkimudafieQ23.pdf", pdfType: "semester"}
        ]
      },
      "Mühəndis qrafikası": {
        type: "yazili", semester: 2, pdfs: [
          { name: "Mühəndis Qrafikası", file: "muhendisqrafikasi1.pdf", pdfType: "semester"}
        ]
      },
      "Ümumi ekologiya": {
        type: "yazili", semester: 2, pdfs: [
          { name: "Ümumi Ekologiya", file: "umumiekologiya1.pdf", pdfType: "semester"}
        ]
      },
      "Riyaziyyat-2": {
        type: "yazili", semester: 2, pdfs: [
          { name: "Riyaziyyat-2 Y25", file: "riyaziyyat2Y25.pdf", pdfType: "semester"}
        ]
      },
      "Analitik kimya və instrumental analiz": {
        type: "yazili", semester: 2, pdfs: [
          { name: "Analitik Kimya və İnstrumental Analiz", file: "akiakollek1.pdf", pdfType: "midterm"}
        ]
      },
      "Sosial işdə idarəetmə": {
        type: "yazili", semester: 2, pdfs: [
          { name: "Sosial İşdə İdarəetmə", file: "sosialisdeidareetmekollek1.pdf", pdfType: "midterm"}
        ]
      },
      "Sosial iş təcrübəsində etik prinsiplər": {
        type: "yazili", semester: 2, pdfs: [
          { name: "Sosial İş Təcrübəsində Etik Prinsiplər", file: "sitepkollek1.pdf", pdfType: "midterm"},
          { name: "Sosial İş Təcrübəsində Etik Prinsiplər", file: "sitepkollek2.pdf", pdfType: "midterm"}
        ]
      },
      "Psixologiya": {
        type: "test", semester: 2, pdfs: [
          { name: "Psixologiya Y23", file: "psixologiyaY23.pdf", pdfType: "semester"},
          { name: "Psixologiya", file: "psixologiyakollek1.pdf", pdfType: "midterm"}
        ]
      },
    "Sosial işin nəzəriyyəsi və təcrübəsi-2": {
        type: "yazili", semester: 2, pdfs: [
          { name: "Sosial işin nəzəriyyəsi və təcrübəsi-2", file: "sint1.pdf", pdfType: "semester"},
          { name: "Sosial işin nəzəriyyəsi və təcrübəsi-2", file: "sintkollek1.pdf", pdfType: "midterm"}
        ]
      },
      "Sosial işdə riyazi metodlar": {
        type: "test", semester: 2, pdfs: [
          { name: "Sosial İşdə Riyazi Metodlar", file: "sirmkollek1.pdf", pdfType: "midterm"}
        ]
      },
      "Liner cebir ve matematiksel analiz": {
        type: "test", semester: 1, pdfs: [
          { name: "Liner Cebir ve Matematiksel Analiz Q26", file: "lcmaQ26.pdf" , pdfType: "semester"},
          { name: "Liner Cebir ve Matematiksel Analiz Q23", file: "lcmaQ23.pdf" , pdfType: "semester"}
        ]
      },
      "Azerbaycanın tarihi": {
        type: "test", semester: 1, pdfs: [
          { name: "Azerbaycanın Tarihi Q26", file: "aztarihiQ26.pdf", pdfType: "semester"},
          { name: "Azerbaycanın Tarihi Q25", file: "aztarihiQ25.pdf", pdfType: "semester"}
        ]
      },
      "Bilgi işlem teknolojileri": {
        type: "test", semester: 1, pdfs: [
          { name: "Bilgi İşlem Teknolojileri", file: "bit1.pdf", pdfType: "semester"}
        ]
      },
      "Yönetim ve organizasyon": {
        type: "test", semester: 1, pdfs: [
          { name: "Yönetim ve Organizasyon Q25", file: "yonetimorganizasyonQ25.pdf", pdfType: "semester"}
        ]
      },
      "Olasılık teorisi ve matematiksel istatistik": {
        type: "test", semester: 2, pdfs: [
          { name: "Olasılık Teorisi ve Matematiksel İstatistik Y26", file: "otmiY26.pdf", pdfType: "semester"}
        ]
      },
    }
  },
  "2-ci kurs": {
    icon: "📗",
    subjects: {
      "Mikroiqtisadiyyat": {
        type: "yazili", semester: 1, pdfs: [
          { name: "Mikroiqtisadiyyat", file: "mikroiqt1.pdf" , pdfType: "semester"},
          { name: "Mikroiqtisadiyyat ", file: "mikroiqt2.pdf" , pdfType: "semester"},
          { name: "Mikroiqtisadiyyat", file: "mikroiqt3.pdf" , pdfType: "semester"},
          { name: "Mikroiqtisadiyyat", file: "mikroiqtmesele1.pdf" , pdfType: "task"},
          { name: "Mikroiqtisadiyyat", file: "mikroiqtmesele2.pdf" , pdfType: "task"}
        ]
      },
      "Qiymət siyasəti": {
        type: "yazili", semester: 1, pdfs: [
          { name: "Qiymət Siyasəti", file: "qiymetkollek1.pdf", pdfType: "midterm"}
        ]
      },
      "Əməyin iqtisadiyyatı": {
        type: "yazili", semester: 1, pdfs: [
          { name: "Əməyin İqtisadiyyatı", file: "emek1.pdf", pdfType: "semester"},
          { name: "Əməyin İqtisadiyyatı", file: "emekkollek1.pdf", pdfType: "midterm"}
        ]
      },
      "Xarici dildə işgüzar və akademik kommunikasiya B1": {
        type: "test",  semester: 1,  pdfs: [
          { name: "Forrest Gump B1", file: "forrestgumpB1.pdf" , pdfType: "midterm"}
        ]
      },
      "Ətraf mühitin iqtisadiyyatı": {
        type: "yazili", semester: 1, pdfs: [
          { name: "Ətraf Mühitin İqtisadiyyatı", file: "emi1.pdf", pdfType: "semester"},
          { name: "Ətraf Mühitin İqtisadiyyatı", file: "emi2.pdf", pdfType: "semester"},
          { name: "Ətraf Mühitin İqtisadiyyatı", file: "emikollek1.pdf", pdfType: "midterm"},
          { name: "Ətraf Mühitin İqtisadiyyatı", file: "emikollek2.pdf", pdfType: "midterm"}
        ]
      },
      "Azərbaycan iqtisadiyyatı": {
        type: "yazili", semester: 2, pdfs: [
          { name: "Azərbaycan İqtisadiyyatı", file: "aziqt1.pdf", pdfType: "semester"},
          { name: "Azərbaycan İqtisadiyyatı", file: "aziqt2.pdf", pdfType: "semester"},
          { name: "Azərbaycan İqtisadiyyatı", file: "aziqt3.pdf", pdfType: "semester"}
        ]
      },
      "Makroiqtisadiyyat": {
        type: "yazili", semester: 2, pdfs: [
          { name: "Makroiqtisadiyyat", file: "makroiqt1.pdf", pdfType: "semester"},
          { name: "Makroiqtisadiyyat", file: "makroiqtmesele1.pdf", pdfType: "task"}
        ]
      },
      "Maliyyə uçotu": {
        type: "test", semester: 2, pdfs: [
          { name: "Maliyyə Uçotu Q26", file: "maliyyeQ26.pdf", pdfType: "semester"},
          { name: "Maliyyə Uçotu", file: "maliyyekollek1.pdf", pdfType: "midterm"},
        ]
      },
      "Xarici dildə işgüzar və akademik kommunikasiya B1+": {
        type: "test", semester: 2, pdfs: [
          { name: "Sherlock Holmes B1+", file: "sherlockholmesB1+.pdf", pdfType: "midterm"}
        ]
      },
      "İqtisadi fikir tarixi": {
        type: "yazili", semester: 2, pdfs: [
          { name: "İqtisadi Fikir Tarixi", file: "iqtfkrtrx1.pdf", pdfType: "semester"},
          { name: "İqtisadi Fikir Tarixi", file: "iqtfkrtrx2.pdf", pdfType: "semester"},
          { name: "İqtisadi Fikir Tarixi", file: "iqtfkrtrx3.pdf", pdfType: "semester"}
        ]
      },
      "Xərclərin idarə edilməsi": { 
        type: "test", semester: 2, pdfs: [
          { name: "Xərclərin İdarə Edilməsi Y25", file: "xerclerY25.pdf", pdfType: "semester"}
        ]
      },
    }
  },
  "3-cü kurs": {
    icon: "📙",
    subjects: {
      "Mülki müdafiə": {
        type: "test", semester: 1, pdfs: [
          { name: "Mülki Müdafiə Q26", file: "mulkimudafieQ26.pdf", pdfType: "semester"},
          { name: "Mülki Müdafiə Y24", file: "mulkimudafieY24.pdf", pdfType: "old"},
          { name: "Mülki Müdafiə Q23", file: "mulkimudafieQ23.pdf", pdfType: "old"}
        ]
      },
      "Statistika": {
        type: "yazili", semester: 1, pdfs: [
          { name: "Statistika", file: "statistika.pdf", pdfType: "optional"}
        ]
      }
    }
  },
  "4-cü kurs": {
    icon: "📕",
    subjects: {
      "Menecment": {
        type: "test", semester: 1, pdfs: [
          { name: "Management material", file: "Manage.pdf", pdfType: "optional"}
        ]
      }
    }
  }
};

const extrasData = {
  "1-ci kurs": [
    { name: "Ehtimal nəzəriyyəsi və riyazi statistika - Kollekvium", file: "enrskollektaplarla1.pdf", desc: "Bir çox testin yanında həlli yolu var", pdfType: "optional"},
    { name: "Azərbaycan dilində işgüzar və akademik kommunikasiya - Test", file: "adiaktest1.pdf", desc: "ADİAK fənninə aid test", pdfType: "optional"},
    { name: "Ümumi kimya - 20 ballar", file: "umumikimya20ballar.pdf", desc: "Ümumi Kimya fənninin 20 ballıq sualları", pdfType: "optional"}
  ],
  "2-ci kurs": [
    { name: "Robinson Crusoe - Azərbaycan", file: "robinsonazeA2.pdf", desc: "Robinson Crusoe Azərbaycan dilindəki versiyası", pdfType: "optional"}
  ],
  "3-cü kurs": [
    { name: "Nümunə Material", file: "numune3.pdf", desc: "Əlavə qeydlər" }
  ],
  "4-cü kurs": [
    { name: "Nümunə Material", file: "numune4.pdf", desc: "Əlavə qeydlər" }
  ]
};
