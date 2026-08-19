export interface Testament {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  testament_id: number;
  name: string;
  abbreviation: string;
  chapter_count: number;
}

export interface Verse {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
  book_name?: string;
  book_abbrev?: string;
}

export interface VerseSearchResult extends Verse {
  book_name: string;
  reference: string;
}
