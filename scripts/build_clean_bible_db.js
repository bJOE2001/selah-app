const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const userDbPath = path.join(__dirname, '..', 'KJV.db');
const destDbPath = path.join(__dirname, '..', 'assets', 'db', 'bible-kjv.db');

const userDb = new Database(userDbPath);

// 66 Canonical Books metadata
const CANONICAL = [
  { id: 1, name: "Genesis", abbrev: "GEN", chapters: 50, testId: 1 },
  { id: 2, name: "Exodus", abbrev: "EXO", chapters: 40, testId: 1 },
  { id: 3, name: "Leviticus", abbrev: "LEV", chapters: 27, testId: 1 },
  { id: 4, name: "Numbers", abbrev: "NUM", chapters: 36, testId: 1 },
  { id: 5, name: "Deuteronomy", abbrev: "DEU", chapters: 34, testId: 1 },
  { id: 6, name: "Joshua", abbrev: "JOS", chapters: 24, testId: 1 },
  { id: 7, name: "Judges", abbrev: "JDG", chapters: 21, testId: 1 },
  { id: 8, name: "Ruth", abbrev: "RUT", chapters: 4, testId: 1 },
  { id: 9, name: "1 Samuel", abbrev: "1SA", chapters: 31, testId: 1 },
  { id: 10, name: "2 Samuel", abbrev: "2SA", chapters: 24, testId: 1 },
  { id: 11, name: "1 Kings", abbrev: "1KI", chapters: 22, testId: 1 },
  { id: 12, name: "2 Kings", abbrev: "2KI", chapters: 25, testId: 1 },
  { id: 13, name: "1 Chronicles", abbrev: "1CH", chapters: 29, testId: 1 },
  { id: 14, name: "2 Chronicles", abbrev: "2CH", chapters: 36, testId: 1 },
  { id: 15, name: "Ezra", abbrev: "EZR", chapters: 10, testId: 1 },
  { id: 16, name: "Nehemiah", abbrev: "NEH", chapters: 13, testId: 1 },
  { id: 17, name: "Esther", abbrev: "EST", chapters: 10, testId: 1 },
  { id: 18, name: "Job", abbrev: "JOB", chapters: 42, testId: 1 },
  { id: 19, name: "Psalms", abbrev: "PSA", chapters: 150, testId: 1 },
  { id: 20, name: "Proverbs", abbrev: "PRO", chapters: 31, testId: 1 },
  { id: 21, name: "Ecclesiastes", abbrev: "ECC", chapters: 12, testId: 1 },
  { id: 22, name: "Song of Solomon", abbrev: "SNG", chapters: 8, testId: 1 },
  { id: 23, name: "Isaiah", abbrev: "ISA", chapters: 66, testId: 1 },
  { id: 24, name: "Jeremiah", abbrev: "JER", chapters: 52, testId: 1 },
  { id: 25, name: "Lamentations", abbrev: "LAM", chapters: 5, testId: 1 },
  { id: 26, name: "Ezekiel", abbrev: "EZK", chapters: 48, testId: 1 },
  { id: 27, name: "Daniel", abbrev: "DAN", chapters: 12, testId: 1 },
  { id: 28, name: "Hosea", abbrev: "HOS", chapters: 14, testId: 1 },
  { id: 29, name: "Joel", abbrev: "JOL", chapters: 3, testId: 1 },
  { id: 30, name: "Amos", abbrev: "AMO", chapters: 9, testId: 1 },
  { id: 31, name: "Obadiah", abbrev: "OBA", chapters: 1, testId: 1 },
  { id: 32, name: "Jonah", abbrev: "JON", chapters: 4, testId: 1 },
  { id: 33, name: "Micah", abbrev: "MIC", chapters: 7, testId: 1 },
  { id: 34, name: "Nahum", abbrev: "NAM", chapters: 3, testId: 1 },
  { id: 35, name: "Habakkuk", abbrev: "HAB", chapters: 3, testId: 1 },
  { id: 36, name: "Zephaniah", abbrev: "ZEP", chapters: 3, testId: 1 },
  { id: 37, name: "Haggai", abbrev: "HAG", chapters: 2, testId: 1 },
  { id: 38, name: "Zechariah", abbrev: "ZEC", chapters: 14, testId: 1 },
  { id: 39, name: "Malachi", abbrev: "MAL", chapters: 4, testId: 1 },
  { id: 40, name: "Matthew", abbrev: "MAT", chapters: 28, testId: 2 },
  { id: 41, name: "Mark", abbrev: "MRK", chapters: 16, testId: 2 },
  { id: 42, name: "Luke", abbrev: "LUK", chapters: 24, testId: 2 },
  { id: 43, name: "John", abbrev: "JHN", chapters: 21, testId: 2 },
  { id: 44, name: "Acts", abbrev: "ACT", chapters: 28, testId: 2 },
  { id: 45, name: "Romans", abbrev: "ROM", chapters: 16, testId: 2 },
  { id: 46, name: "1 Corinthians", abbrev: "1CO", chapters: 16, testId: 2 },
  { id: 47, name: "2 Corinthians", abbrev: "2CO", chapters: 13, testId: 2 },
  { id: 48, name: "Galatians", abbrev: "GAL", chapters: 6, testId: 2 },
  { id: 49, name: "Ephesians", abbrev: "EPH", chapters: 6, testId: 2 },
  { id: 50, name: "Philippians", abbrev: "PHP", chapters: 4, testId: 2 },
  { id: 51, name: "Colossians", abbrev: "COL", chapters: 4, testId: 2 },
  { id: 52, name: "1 Thessalonians", abbrev: "1TH", chapters: 5, testId: 2 },
  { id: 53, name: "2 Thessalonians", abbrev: "2TH", chapters: 3, testId: 2 },
  { id: 54, name: "1 Timothy", abbrev: "1TI", chapters: 6, testId: 2 },
  { id: 55, name: "2 Timothy", abbrev: "2TI", chapters: 4, testId: 2 },
  { id: 56, name: "Titus", abbrev: "TIT", chapters: 3, testId: 2 },
  { id: 57, name: "Philemon", abbrev: "PHM", chapters: 1, testId: 2 },
  { id: 58, name: "Hebrews", abbrev: "HEB", chapters: 13, testId: 2 },
  { id: 59, name: "James", abbrev: "JAS", chapters: 5, testId: 2 },
  { id: 60, name: "1 Peter", abbrev: "1PE", chapters: 5, testId: 2 },
  { id: 61, name: "2 Peter", abbrev: "2PE", chapters: 3, testId: 2 },
  { id: 62, name: "1 John", abbrev: "1JN", chapters: 5, testId: 2 },
  { id: 63, name: "2 John", abbrev: "2JN", chapters: 1, testId: 2 },
  { id: 64, name: "3 John", abbrev: "3JN", chapters: 1, testId: 2 },
  { id: 65, name: "Jude", abbrev: "JUD", chapters: 1, testId: 2 },
  { id: 66, name: "Revelation", abbrev: "REV", chapters: 22, testId: 2 },
];

// Remove old destination DB if exists
if (fs.existsSync(destDbPath)) {
  fs.unlinkSync(destDbPath);
}

const destDb = new Database(destDbPath);

// Create standard tables
destDb.exec(`
  CREATE TABLE testaments (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );

  INSERT INTO testaments (id, name) VALUES (1, 'Old Testament'), (2, 'New Testament');

  CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    testament_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    chapter_count INTEGER NOT NULL,
    FOREIGN KEY (testament_id) REFERENCES testaments(id)
  );

  CREATE TABLE verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE cached_verses (
    id TEXT PRIMARY KEY,
    translation_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    book_name TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL
  );

  CREATE INDEX idx_verses_book_chap ON verses(book_id, chapter);
  CREATE INDEX idx_verses_lookup ON verses(book_id, chapter, verse);
  CREATE INDEX idx_cached_verses_lookup ON cached_verses(translation_id, book_id, chapter);
`);

const insertBook = destDb.prepare(`
  INSERT INTO books (id, testament_id, name, abbreviation, chapter_count)
  VALUES (?, ?, ?, ?, ?)
`);

const insertVerse = destDb.prepare(`
  INSERT INTO verses (book_id, chapter, verse, text)
  VALUES (?, ?, ?, ?)
`);

// Unique query per book (IDs 1-66 map directly in KJV_verses!)
const userVersesStmt = userDb.prepare(`
  SELECT chapter, verse, text
  FROM KJV_verses
  WHERE book_id = ?
  GROUP BY chapter, verse
  ORDER BY chapter ASC, verse ASC
`);

let totalVerses = 0;

const buildTx = destDb.transaction(() => {
  for (const c of CANONICAL) {
    insertBook.run(c.id, c.testId, c.name, c.abbrev, c.chapters);

    const verses = userVersesStmt.all(c.id);
    console.log(`[${c.id}/66] ${c.name}: ${verses.length} verses`);
    for (const v of verses) {
      // Clean Strong's numbers if any e.g. <H1234> or clean text
      const cleanText = v.text.replace(/<[A-Za-z0-9_]+>/g, '').replace(/\{([^}]+)\}/g, '$1').replace(/\s+/g, ' ').trim();
      insertVerse.run(c.id, v.chapter, v.verse, cleanText);
      totalVerses++;
    }
  }
});

buildTx();

console.log(`\n🎉 DONE! Clean SQLite database built with ${totalVerses} unique verses across all 66 books!`);

// Verify 2 Samuel 14
const check2Sam14 = destDb.prepare('SELECT count(*) as c FROM verses WHERE book_id = 10 AND chapter = 14').get();
console.log('Verification: 2 Samuel 14 has', check2Sam14.c, 'verses.');

destDb.close();
userDb.close();
