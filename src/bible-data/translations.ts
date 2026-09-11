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
  downloadUrl?: string;
  fallbackUrl?: string;
  approximateSizeMB?: string;
}

export const BIBLE_TRANSLATIONS: BibleTranslation[] = [
  // Popular English
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
    id: "bsb",
    code: "BSB",
    name: "Berean Standard Bible",
    category: "Popular English",
    language: "English",
    year: 2016,
    description:
      "Modern, fluent, highly readable English translation based on original Greek and Hebrew. Dedicated to the public domain.",
    isBuiltInOffline: false,
    apiIdentifier: "BSB",
    approximateSizeMB: "3.6 MB",
  },
  {
    id: "web",
    code: "WEB",
    name: "World English Bible",
    category: "Popular English",
    language: "English",
    year: 2000,
    description:
      "Clean, modern 21st-century English translation in the public domain. Easy to understand.",
    isBuiltInOffline: false,
    apiIdentifier: "WEB",
    approximateSizeMB: "3.8 MB",
  },

  // Literal & Study
  {
    id: "asv",
    code: "ASV",
    name: "American Standard Version",
    category: "Literal & Study",
    language: "English",
    year: 1901,
    description:
      "Renowned for strict literal precision, scholarship, and biblical study accuracy. In the public domain.",
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
      "Strict word-for-word translation preserving original Hebrew and Greek verb tenses. In the public domain.",
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
    description:
      "Traditional Catholic translation from the Latin Vulgate in the public domain.",
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
      "Historical Latin scripture promulgated by the Council of Trent in the public domain.",
    isBuiltInOffline: false,
    apiIdentifier: "VULG",
    approximateSizeMB: "3.6 MB",
  },

  // International
  {
    id: "adb",
    code: "ADB",
    name: "Ang Dating Biblia (1905)",
    category: "International",
    language: "Tagalog / Filipino",
    year: 1905,
    description:
      "The classic, beloved Protestant Tagalog Bible translation. 100% in the public domain.",
    isBuiltInOffline: false,
    downloadUrl:
      "https://cdn.jsdelivr.net/gh/scrollmapper/bible_databases@master/formats/json/TagAngBiblia.json",
    fallbackUrl:
      "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/TagAngBiblia.json",
    approximateSizeMB: "4.4 MB",
  },
  {
    id: "cebb",
    code: "CEBB",
    name: "Ang Santa Biblia (1917 Bugna)",
    category: "International",
    language: "Cebuano / Bisaya",
    year: 1917,
    description:
      "The standard classic Cebuano/Bisaya Bible translation. 100% in the public domain.",
    isBuiltInOffline: false,
    downloadUrl:
      "https://cdn.jsdelivr.net/gh/scrollmapper/bible_databases@master/formats/json/CebPinadayag.json",
    fallbackUrl:
      "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/CebPinadayag.json",
    approximateSizeMB: "4.6 MB",
  },
  {
    id: "cuv",
    code: "CUV",
    name: "Chinese Union Version (和合本)",
    category: "International",
    language: "Chinese",
    year: 1919,
    description:
      "The standard and most beloved Chinese Bible translation in the public domain.",
    isBuiltInOffline: false,
    apiIdentifier: "CUV",
    approximateSizeMB: "3.5 MB",
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
