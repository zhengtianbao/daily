import * as SQLite from 'expo-sqlite';

import { Bookmark } from '@/vendor/epubjs-react-native/src';

export type Book = {
  id?: number;
  title: string;
  author: string;
  uri: string;
  cover: string | null;
  updateDate: Date;
  lastreadDate: Date;
  currentLocation: string | null;
  progress: number;
};

export type BookSettings = {
  id?: number;
  bookId: number;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
};

export class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db != null) {
      return;
    }
    try {
      this.db = await SQLite.openDatabaseAsync('database.db');
      await this.createTables();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        uri TEXT NOT NULL,
        cover TEXT NULL,
        updateDate TEXT NOT NULL,
        lastreadDate TEXT NOT NULL,
        currentLocation TEXT NULL, 
        progress INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS book_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookId INTEGER NOT NULL,
        backgroundColor TEXT NOT NULL,
        fontFamily TEXT NOT NULL,
        fontSize INTEGER NOT NULL,
        FOREIGN KEY (bookId) REFERENCES books(id)
      );
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookId INTEGER NOT NULL,
        bookmarkId TEXT NOT NULL,
        bookmark TEXT NOT NULL,
        FOREIGN KEY (bookId) REFERENCES books(id)
      );
    `);
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  async insertBook(book: Book): Promise<number> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    const bookExist = await this.getBookByTitle(book.title);
    if (bookExist !== null) {
      return 0;
    }

    try {
      const result = await this.db.runAsync(
        `INSERT INTO books (title, author, uri, cover, updateDate, lastreadDate, currentLocation, progress)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          book.title,
          book.author,
          book.uri,
          book.cover || null,
          book.updateDate.toISOString(),
          book.lastreadDate.toISOString(),
          book.currentLocation || null,
          book.progress || 0,
        ]
      );

      if (!result) {
        throw new Error('Failed to insert book');
      }

      await this.db.runAsync(
        `INSERT INTO book_settings (bookId, backgroundColor, fontFamily, fontSize)
         VALUES (?, ?, ?, ?)`,
        [result.lastInsertRowId, 'white', 'serif', 20]
      );

      console.log('Book inserted successfully');
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error inserting book:', error);
      throw error;
    }
  }

  async getBookByTitle(title: string): Promise<Book | null> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      const query = `SELECT * FROM books WHERE title = ?`;
      const result = await this.db.getFirstAsync<any>(query, [title]);
      if (!result) {
        return null;
      }
      return {
        id: result.id,
        title: result.title,
        author: result.author,
        uri: result.uri,
        cover: result.cover,
        updateDate: result.updateDate,
        lastreadDate: result.lastreadDate,
        currentLocation: result.currentLocation,
        progress: result.progress,
      };
    } catch (error) {
      console.error('Error getting book by title:', error);
      throw error;
    }
  }

  async getAllBooks(): Promise<Book[]> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      const result = await this.db.getAllAsync<any>(
        `SELECT * FROM books ORDER BY lastreadDate DESC`,
        []
      );

      const books: Book[] = result.map((row: any) => ({
        id: row.id,
        title: row.title,
        author: row.author,
        uri: row.uri,
        cover: row.cover,
        updateDate: new Date(row.updateDate),
        lastreadDate: new Date(row.lastreadDate),
        currentLocation: row.currentLocation,
        progress: row.progress,
      }));

      return books;
    } catch (error) {
      console.error(`Error fetching books:`, error);
      throw error;
    }
  }

  async updateBook(title: string, currentLocation: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      await this.db.runAsync(
        `UPDATE books 
         SET currentLocation = ?, lastreadDate = ?
         WHERE title = ?`,
        [currentLocation, new Date().toISOString(), title]
      );

      console.log('Book updated successfully');
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  }

  async updateBookProgress(title: string, progress: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(`UPDATE books SET progress = ? WHERE title = ?`, [progress, title]);
    } catch (error) {
      console.error('Error updating book progress:', error);
      throw error;
    }
  }

  async deleteBook(title: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      const book = await this.getBookByTitle(title);
      if (!book) {
        throw new Error(`Book '${title}' not found.`);
      }

      await this.db.withTransactionAsync(async () => {
        await this.db!.runAsync(
          `DELETE FROM bookmarks WHERE bookId = (SELECT id FROM books WHERE title = ?)`,
          [title]
        );

        await this.db!.runAsync(
          `DELETE FROM book_settings WHERE bookId = (SELECT id FROM books WHERE title = ?)`,
          [title]
        );

        await this.db!.runAsync('DELETE FROM books WHERE title = ?', [title]);
      });

      console.log(`Book '${title}' and associated data successfully deleted.`);
    } catch (error) {
      console.error(`Error deleting book '${title}':`, error);
      throw error;
    }
  }

  async getBookSettingsByBookTitle(title: string): Promise<BookSettings | null> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      const query = `SELECT * FROM book_settings
                     WHERE bookId = (SELECT id FROM books WHERE title = ?)`;
      const result = await this.db.getFirstAsync<any>(query, [title]);
      if (!result) {
        return null;
      }
      console.log(result);
      return {
        id: result.id,
        bookId: result.bookId,
        backgroundColor: result.backgroundColor,
        fontFamily: result.fontFamily,
        fontSize: result.fontSize,
      };
    } catch (error) {
      console.error('Error getting book settings by book title:', error);
      throw error;
    }
  }

  async updateBookSettingsByBookTitle(
    title: string,
    backgroundColor: string,
    fontFamily: string,
    fontSize: number
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      const query = `UPDATE book_settings
                     SET backgroundColor = ?, fontFamily = ?, fontSize = ?
                     WHERE bookId = (SELECT id FROM books WHERE title = ?)`;
      await this.db.runAsync(query, [backgroundColor, fontFamily, fontSize, title]);
      console.log('Book settings updated successfully');
    } catch (error) {
      console.error('Error updating book settings:', error);
      throw error;
    }
  }

  async getBookmarksByBookTitle(title: string): Promise<Bookmark[]> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      const query = `SELECT * FROM bookmarks
                     WHERE bookId = (SELECT id FROM books WHERE title = ?)`;
      const result = await this.db.getAllAsync<any>(query, [title]);
      return result.map((row: any) => JSON.parse(row.bookmark) as Bookmark);
    } catch (error) {
      console.error('Error getting bookmarks by book title:', error);
      throw error;
    }
  }

  async addBookmarkByBookTitle(title: string, bookmark: Bookmark): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      await this.db.runAsync(
        `INSERT INTO bookmarks (bookId, bookmarkId, bookmark) VALUES ((SELECT id FROM books WHERE title = ?), ?, ?)`,
        [title, bookmark.id, JSON.stringify(bookmark)]
      );
      console.log('Bookmark added successfully');
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  async deleteBookmarkByBookTitleAndBookmarkId(title: string, bookmarkId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      await this.db.runAsync(
        `DELETE FROM bookmarks WHERE bookId = (SELECT id FROM books WHERE title = ?) AND bookmarkId = ?`,
        [title, bookmarkId]
      );
      console.log('Bookmark deleted successfully');
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('Database connection closed');
    }
  }
}

export const database = new Database();
