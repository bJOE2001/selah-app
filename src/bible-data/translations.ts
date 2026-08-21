export interface BibleTranslation {
  id: string;
  code: string;
  name: string;
  category:
    | "Popular English"
    | "Literal & Study"
    | "Historical & Classic"
    | "International";
  language: string;
  year?: number;
  description: string;
  isBuiltInOffline: boolean;
  apiIdentifier?: string;
  approximateSizeMB?: string;
}

export const BIBLE_TRANSLATIONS: BibleTranslation[] = [
  // Popular English
  {
    id: "nlt",
    code: "NLT",
    name: "New Living Translation",
    category: "Popular English",
    language: "English",
    year: 1996,
    description:
      "Clear, warm, dynamic thought-for-thought English translation loved for devotion and clarity.",
    isBuiltInOffline: false,
    apiIdentifier: "NLT",
    approximateSizeMB: "3.8 MB",
  },
  {
    id: "kjv",
    code: "KJV",
    name: "King James Version",
    category: "Popular English",
    language: "English",
    year: 1611,
    description:
      "The monumental, poetic classic of the English language. Permanently bundled offline.",
    isBuiltInOffline: true,
    apiIdentifier: "KJV",
    approximateSizeMB: "Bundled",
  },
  {
    id: "niv",
    code: "NIV",
    name: "New International Version",
    category: "Popular English",
    language: "English",
    year: 2011,
    description:
      "The world's most popular modern English Bible balancing readability and accuracy.",
    isBuiltInOffline: false,
    apiIdentifier: "NIV2011",
    approximateSizeMB: "3.8 MB",
  },
  {
    id: "esv",
    code: "ESV",
    name: "English Standard Version",
    category: "Popular English",
    language: "English",
    year: 2001,
    description:
      "Essentially literal translation emphasizing word-for-word accuracy and literary beauty.",
    isBuiltInOffline: false,
    apiIdentifier: "ESV",
    approximateSizeMB: "3.8 MB",
  },
  {
    id: "nkjv",
    code: "NKJV",
    name: "New King James Version",
    category: "Popular English",
    language: "English",
    year: 1982,
    description:
      "Modern update of the classic KJV preserving traditional reverence with contemporary English.",
    isBuiltInOffline: false,
    apiIdentifier: "NKJV",
    approximateSizeMB: "3.8 MB",
  },
  {
    id: "bsb",
    code: "BSB",
    name: "Berean Standard Bible",
    category: "Popular English",
    language: "English",
    year: 2016,
    description:
      "Modern, beautifully transparent translation based on the best Greek and Hebrew sources.",
    isBuiltInOffline: false,
    apiIdentifier: "BSB",
    approximateSizeMB: "3.6 MB",
  },
  {
    id: "csb",
    code: "CSB",
    name: "Christian Standard Bible",
    category: "Popular English",
    language: "English",
    year: 2017,
    description:
      "Optimal blend of accuracy and readability, faithful to original biblical manuscripts.",
    isBuiltInOffline: false,
    apiIdentifier: "CSB17",
    approximateSizeMB: "3.8 MB",
  },
  {
    id: "amp",
    code: "AMP",
    name: "Amplified Bible",
    category: "Popular English",
    language: "English",
    year: 2015,
    description:
      "Uses synonyms and explanations to reveal subtle shades of meaning in the text.",
    isBuiltInOffline: false,
    apiIdentifier: "AMP",
    approximateSizeMB: "4.0 MB",
  },
  {
    id: "msg",
    code: "MSG",
    name: "The Message",
    category: "Popular English",
    language: "English",
    year: 2002,
    description:
      "A contemporary paraphrase that presents the gospel in vivid, expressive English.",
    isBuiltInOffline: false,
    apiIdentifier: "MSG",
    approximateSizeMB: "3.7 MB",
  },
  {
    id: "net",
    code: "NET",
    name: "New English Translation",
    category: "Popular English",
    language: "English",
    year: 2007,
    description:
      "Modern English translation with high fidelity to original scholarship.",
    isBuiltInOffline: false,
    apiIdentifier: "NET",
    approximateSizeMB: "3.9 MB",
  },
  {
    id: "web",
    code: "WEB",
    name: "World English Bible",
    category: "Popular English",
    language: "English",
    year: 2000,
    description:
      "Modern, highly readable, and accurate English translation in the public domain.",
    isBuiltInOffline: false,
    apiIdentifier: "WEB",
    approximateSizeMB: "3.8 MB",
  },

  // Literal & Study
  {
    id: "nasb",
    code: "NASB",
    name: "New American Standard Bible",
    category: "Literal & Study",
    language: "English",
    year: 1995,
    description:
      "Renowned worldwide as the gold standard of literal word-for-word English translations.",
    isBuiltInOffline: false,
    apiIdentifier: "NASB",
    approximateSizeMB: "3.8 MB",
  },
  {
    id: "asv",
    code: "ASV",
    name: "American Standard Version",
    category: "Literal & Study",
    language: "English",
    year: 1901,
    description:
      "Renowned for strict literal precision, scholarship, and biblical study accuracy.",
    isBuiltInOffline: false,
    apiIdentifier: "ASV",
    approximateSizeMB: "3.7 MB",
  },
  {
    id: "ylt",
    code: "YLT",
    name: "Young's Literal Translation",
    category: "Literal & Study",
    language: "English",
    year: 1898,
    description:
      "Strict, word-for-word translation preserving original Hebrew and Greek tenses.",
    isBuiltInOffline: false,
    apiIdentifier: "YLT",
    approximateSizeMB: "3.7 MB",
  },

  // Historical & Classic
  {
    id: "dra",
    code: "DRA",
    name: "Douay-Rheims Bible",
    category: "Historical & Classic",
    language: "English",
    year: 1899,
    description: "Traditional Catholic translation from the Latin Vulgate.",
    isBuiltInOffline: false,
    apiIdentifier: "DRB",
    approximateSizeMB: "3.8 MB",
  },
  {
    id: "clementine",
    code: "VULG",
    name: "Clementine Latin Vulgate",
    category: "Historical & Classic",
    language: "Latin",
    year: 1592,
    description:
      "Historical Latin scripture promulgated by the Council of Trent.",
    isBuiltInOffline: false,
    apiIdentifier: "VULG",
    approximateSizeMB: "3.6 MB",
  },

  // International
  {
    id: "rv1960",
    code: "RVR60",
    name: "Reina-Valera 1960",
    category: "International",
    language: "Spanish",
    year: 1960,
    description: "The most widely used and loved Spanish Bible translation worldwide.",
    isBuiltInOffline: false,
    apiIdentifier: "RV1960",
    approximateSizeMB: "3.7 MB",
  },
  {
    id: "cuv",
    code: "CUV",
    name: "Chinese Union Version (和合本)",
    category: "International",
    language: "Chinese",
    year: 1919,
    description: "The standard and most beloved Chinese Bible translation.",
    isBuiltInOffline: false,
    apiIdentifier: "CUV",
    approximateSizeMB: "3.5 MB",
  },
  {
    id: "almeida",
    code: "ARA",
    name: "Almeida Revista e Atualizada",
    category: "International",
    language: "Portuguese",
    year: 1993,
    description:
      "Classic Portuguese translation widely used across Brazil and Portugal.",
    isBuiltInOffline: false,
    apiIdentifier: "ARA",
    approximateSizeMB: "3.6 MB",
  },
  {
    id: "rccv",
    code: "VDCL",
    name: "Romanian Cornilescu",
    category: "International",
    language: "Romanian",
    year: 1931,
    description: "The standard modern Romanian Protestant Bible translation.",
    isBuiltInOffline: false,
    apiIdentifier: "VDCL",
    approximateSizeMB: "3.6 MB",
  },
];

export function getTranslation(id: string): BibleTranslation {
  const found = BIBLE_TRANSLATIONS.find(
    (t) =>
      t.id.toLowerCase() === id.toLowerCase() ||
      t.code.toLowerCase() === id.toLowerCase(),
  );
  return found || BIBLE_TRANSLATIONS[0];
}
