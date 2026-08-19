const https = require('https');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// 66 Canonical Books in exact order
const CANONICAL_BOOKS = [
  // Old Testament (39)
  { id: 1, testament_id: 1, name: 'Genesis', abbreviation: 'Gen' },
  { id: 2, testament_id: 1, name: 'Exodus', abbreviation: 'Exo' },
  { id: 3, testament_id: 1, name: 'Leviticus', abbreviation: 'Lev' },
  { id: 4, testament_id: 1, name: 'Numbers', abbreviation: 'Num' },
  { id: 5, testament_id: 1, name: 'Deuteronomy', abbreviation: 'Deu' },
  { id: 6, testament_id: 1, name: 'Joshua', abbreviation: 'Jos' },
  { id: 7, testament_id: 1, name: 'Judges', abbreviation: 'Jdg' },
  { id: 8, testament_id: 1, name: 'Ruth', abbreviation: 'Rut' },
  { id: 9, testament_id: 1, name: '1 Samuel', abbreviation: '1Sa' },
  { id: 10, testament_id: 1, name: '2 Samuel', abbreviation: '2Sa' },
  { id: 11, testament_id: 1, name: '1 Kings', abbreviation: '1Ki' },
  { id: 12, testament_id: 1, name: '2 Kings', abbreviation: '2Ki' },
  { id: 13, testament_id: 1, name: '1 Chronicles', abbreviation: '1Ch' },
  { id: 14, testament_id: 1, name: '2 Chronicles', abbreviation: '2Ch' },
  { id: 15, testament_id: 1, name: 'Ezra', abbreviation: 'Ezr' },
  { id: 16, testament_id: 1, name: 'Nehemiah', abbreviation: 'Neh' },
  { id: 17, testament_id: 1, name: 'Esther', abbreviation: 'Est' },
  { id: 18, testament_id: 1, name: 'Job', abbreviation: 'Job' },
  { id: 19, testament_id: 1, name: 'Psalms', abbreviation: 'Psa' },
  { id: 20, testament_id: 1, name: 'Proverbs', abbreviation: 'Pro' },
  { id: 21, testament_id: 1, name: 'Ecclesiastes', abbreviation: 'Ecc' },
  { id: 22, testament_id: 1, name: 'Song of Solomon', abbreviation: 'Sng' },
  { id: 23, testament_id: 1, name: 'Isaiah', abbreviation: 'Isa' },
  { id: 24, testament_id: 1, name: 'Jeremiah', abbreviation: 'Jer' },
  { id: 25, testament_id: 1, name: 'Lamentations', abbreviation: 'Lam' },
  { id: 26, testament_id: 1, name: 'Ezekiel', abbreviation: 'Ezk' },
  { id: 27, testament_id: 1, name: 'Daniel', abbreviation: 'Dan' },
  { id: 28, testament_id: 1, name: 'Hosea', abbreviation: 'Hos' },
  { id: 29, testament_id: 1, name: 'Joel', abbreviation: 'Jol' },
  { id: 30, testament_id: 1, name: 'Amos', abbreviation: 'Amo' },
  { id: 31, testament_id: 1, name: 'Obadiah', abbreviation: 'Oba' },
  { id: 32, testament_id: 1, name: 'Jonah', abbreviation: 'Jon' },
  { id: 33, testament_id: 1, name: 'Micah', abbreviation: 'Mic' },
  { id: 34, testament_id: 1, name: 'Nahum', abbreviation: 'Nam' },
  { id: 35, testament_id: 1, name: 'Habakkuk', abbreviation: 'Hab' },
  { id: 36, testament_id: 1, name: 'Zephaniah', abbreviation: 'Zep' },
  { id: 37, testament_id: 1, name: 'Haggai', abbreviation: 'Hag' },
  { id: 38, testament_id: 1, name: 'Zechariah', abbreviation: 'Zec' },
  { id: 39, testament_id: 1, name: 'Malachi', abbreviation: 'Mal' },
  // New Testament (27)
  { id: 40, testament_id: 2, name: 'Matthew', abbreviation: 'Mat' },
  { id: 41, testament_id: 2, name: 'Mark', abbreviation: 'Mrk' },
  { id: 42, testament_id: 2, name: 'Luke', abbreviation: 'Luk' },
  { id: 43, testament_id: 2, name: 'John', abbreviation: 'Jhn' },
  { id: 44, testament_id: 2, name: 'Acts', abbreviation: 'Act' },
  { id: 45, testament_id: 2, name: 'Romans', abbreviation: 'Rom' },
  { id: 46, testament_id: 2, name: '1 Corinthians', abbreviation: '1Co' },
  { id: 47, testament_id: 2, name: '2 Corinthians', abbreviation: '2Co' },
  { id: 48, testament_id: 2, name: 'Galatians', abbreviation: 'Gal' },
  { id: 49, testament_id: 2, name: 'Ephesians', abbreviation: 'Eph' },
  { id: 50, testament_id: 2, name: 'Philippians', abbreviation: 'Php' },
  { id: 51, testament_id: 2, name: 'Colossians', abbreviation: 'Col' },
  { id: 52, testament_id: 2, name: '1 Thessalonians', abbreviation: '1Th' },
  { id: 53, testament_id: 2, name: '2 Thessalonians', abbreviation: '2Th' },
  { id: 54, testament_id: 2, name: '1 Timothy', abbreviation: '1Ti' },
  { id: 55, testament_id: 2, name: '2 Timothy', abbreviation: '2Ti' },
  { id: 56, testament_id: 2, name: 'Titus', abbreviation: 'Tit' },
  { id: 57, testament_id: 2, name: 'Philemon', abbreviation: 'Phm' },
  { id: 58, testament_id: 2, name: 'Hebrews', abbreviation: 'Heb' },
  { id: 59, testament_id: 2, name: 'James', abbreviation: 'Jas' },
  { id: 60, testament_id: 2, name: '1 Peter', abbreviation: '1Pe' },
  { id: 61, testament_id: 2, name: '2 Peter', abbreviation: '2Pe' },
  { id: 62, testament_id: 2, name: '1 John', abbreviation: '1Jn' },
  { id: 63, testament_id: 2, name: '2 John', abbreviation: '2Jn' },
  { id: 64, testament_id: 2, name: '3 John', abbreviation: '3Jn' },
  { id: 65, testament_id: 2, name: 'Jude', abbreviation: 'Jud' },
  { id: 66, testament_id: 2, name: 'Revelation', abbreviation: 'Rev' },
];

async function main() {
  console.log('Fetching en_kjv.json Bible dataset...');
  const jsonStr = await fetchUrl(DATA_URL);
  const cleanJson = jsonStr.replace(/^\uFEFF/, '');
  const rawBooks = JSON.parse(cleanJson);
  console.log(`Downloaded ${rawBooks.length} books.`);

  const dbDir = path.join(__dirname, '..', 'assets', 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'bible-kjv.db');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const db = new Database(dbPath);

  // Enable WAL and foreign keys
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  console.log('Creating database tables...');
  db.exec(`
    CREATE TABLE testaments (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );

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
      FOREIGN KEY (book_id) REFERENCES books(id),
      UNIQUE(book_id, chapter, verse)
    );

    CREATE INDEX idx_verses_book_chapter ON verses(book_id, chapter);
    CREATE INDEX idx_verses_text ON verses(text);
  `);

  console.log('Inserting testaments...');
  const insertTestament = db.prepare('INSERT INTO testaments (id, name) VALUES (?, ?)');
  insertTestament.run(1, 'Old Testament');
  insertTestament.run(2, 'New Testament');

  console.log('Inserting books and verses...');
  const insertBook = db.prepare(
    'INSERT INTO books (id, testament_id, name, abbreviation, chapter_count) VALUES (?, ?, ?, ?, ?)'
  );
  const insertVerse = db.prepare(
    'INSERT INTO verses (book_id, chapter, verse, text) VALUES (?, ?, ?, ?)'
  );

  let totalVerses = 0;

  const insertAll = db.transaction(() => {
    for (let i = 0; i < CANONICAL_BOOKS.length; i++) {
      const bookDef = CANONICAL_BOOKS[i];
      const rawBook = rawBooks[i];
      const chapterCount = rawBook.chapters.length;

      insertBook.run(bookDef.id, bookDef.testament_id, bookDef.name, bookDef.abbreviation, chapterCount);

      for (let c = 0; c < rawBook.chapters.length; c++) {
        const chapterNum = c + 1;
        const verses = rawBook.chapters[c];
        for (let v = 0; v < verses.length; v++) {
          const verseNum = v + 1;
          const verseText = String(verses[v]).trim();
          insertVerse.run(bookDef.id, chapterNum, verseNum, verseText);
          totalVerses++;
        }
      }
    }
  });

  insertAll();

  console.log(`Inserted ${CANONICAL_BOOKS.length} books and ${totalVerses} verses.`);

  console.log('Optimizing SQLite database...');
  db.exec('PRAGMA optimize;');
  db.close();

  const stats = fs.statSync(dbPath);
  console.log(`✅ SQLite Bible DB created successfully at ${dbPath}`);
  console.log(`📦 Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error('Error generating Bible database:', err);
  process.exit(1);
});
