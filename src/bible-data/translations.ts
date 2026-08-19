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
  },
  {
    id: "kjv",
    code: "KJV",
    name: "King James Version",
    category: "Popular English",
    language: "English",
    year: 1611,
    description:
      "The monumental, poetic classic of the English language. Bundled offline.",
    isBuiltInOffline: true,
    apiIdentifier: "kjv",
  },
  {
    id: "niv",
    code: "NIV",
    name: "New International Version",
    category: "Popular English",
    language: "English",
    year: 1978,
    description:
      "The world's most popular modern English Bible balancing readability and accuracy.",
    isBuiltInOffline: false,
    apiIdentifier: "NIV",
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
  },
  {
    id: "bbe",
    code: "BBE",
    name: "Bible in Basic English",
    category: "Popular English",
    language: "English",
    year: 1965,
    description:
      "Uses a simplified 1,000-word vocabulary for clear and accessible understanding.",
    isBuiltInOffline: false,
    apiIdentifier: "BBE",
  },
  {
    id: "oeb-us",
    code: "OEB",
    name: "Open English Bible (US)",
    category: "Popular English",
    language: "English",
    year: 2010,
    description: "Contemporary open-source modern English translation.",
    isBuiltInOffline: false,
    apiIdentifier: "oeb-us",
  },

  // Literal & Study
  {
    id: "nasb",
    code: "NASB",
    name: "New American Standard Bible",
    category: "Literal & Study",
    language: "English",
    year: 1971,
    description:
      "Renowned worldwide as the gold standard of literal word-for-word English translations.",
    isBuiltInOffline: false,
    apiIdentifier: "NASB",
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
  },
  {
    id: "darby",
    code: "DARBY",
    name: "Darby Bible",
    category: "Literal & Study",
    language: "English",
    year: 1890,
    description:
      "Close literal translation by J.N. Darby utilizing early Hebrew and Greek texts.",
    isBuiltInOffline: false,
    apiIdentifier: "DARBY",
  },

  // Historical & Classic
  {
    id: "dra",
    code: "DRA",
    name: "Douay-Rheims 1899",
    category: "Historical & Classic",
    language: "English",
    year: 1899,
    description: "Traditional Catholic translation from the Latin Vulgate.",
    isBuiltInOffline: false,
    apiIdentifier: "DRA",
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
  },

  // International
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
  },
  {
    id: "almeida",
    code: "JFA",
    name: "João Ferreira de Almeida",
    category: "International",
    language: "Portuguese",
    year: 1819,
    description:
      "Classic Portuguese translation widely used across Brazil and Portugal.",
    isBuiltInOffline: false,
    apiIdentifier: "JFA",
  },
  {
    id: "rccv",
    code: "RCCV",
    name: "Romanian Cornilescu",
    category: "International",
    language: "Romanian",
    year: 1924,
    description: "The standard modern Romanian Protestant Bible.",
    isBuiltInOffline: false,
    apiIdentifier: "RCCV",
  },
  {
    id: "bkr",
    code: "BKR",
    name: "Bible kralická",
    category: "International",
    language: "Czech",
    year: 1613,
    description: "Historical Czech Protestant Bible translation.",
    isBuiltInOffline: false,
    apiIdentifier: "BKR",
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
