import * as SQLite from 'expo-sqlite';

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
    `);
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

    await this.db.runAsync(`UPDATE books SET progress = ? WHERE title = ?`, [progress, title]);
  }

  async deleteBook(title: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      const book = await this.getBookByTitle(title);
      if (!book) {
        throw new Error(`Book '${title}' not found.`);
      }

      await this.db.runAsync('DELETE FROM books WHERE title = ?', [title]);
      console.log(`Book '${title}' and associated data successfully deleted.`);
    } catch (error) {
      console.error(`Error deleting book '${title}':`, error);
      throw error;
    }
  }
}

export const database = new Database();
