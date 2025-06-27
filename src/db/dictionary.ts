import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

export type WordInfo = {
  id: number;
  word: string;
  sw: string;
  phonetic: string;
  definition: string;
  translation: string;
  pos?: string;
  collins: number;
  oxford: number;
  tag: string;
  bnc: number;
  frq: number;
  exchange: string;
  detail?: string;
  audio?: string;
};

export class Dictionary {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db != null) {
      return;
    }
    try {
      const dbName = 'stardict.db';
      const dbUri = FileSystem.documentDirectory + dbName;
      const dbInfo = await FileSystem.getInfoAsync(dbUri);
      if (!dbInfo.exists) {
        const dbAsset = Asset.fromModule(require('@/assets/db/stardict.db'));
        await dbAsset.downloadAsync();
        await FileSystem.copyAsync({
          from: dbAsset.localUri as string,
          to: dbUri,
        });
        console.log('Downloaded stardict database file to: ', dbUri);
      }

      this.db = await SQLite.openDatabaseAsync(dbUri);
      await this.showTables();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async showTables() {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');
    try {
      const result = await this.db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('Tables:', result);
    } catch (error) {
      console.error('Show tables failed: ', error);
    }
  }

  async getWordInfoByWord(word: string): Promise<WordInfo | null> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');

    try {
      const query = `SELECT * FROM stardict WHERE word = ?`;
      const result = await this.db.getFirstAsync<any>(query, [word]);
      if (!result) {
        return null;
      }
      return {
        id: result.id,
        word: result.word,
        sw: result.sw,
        phonetic: result.phonetic,
        definition: result.definition,
        translation: result.translation,
        pos: result.pos,
        collins: result.collins,
        oxford: result.oxford,
        tag: result.tag,
        bnc: result.bnc,
        frq: result.frq,
        exchange: result.exchange,
        detail: result.detail,
        audio: result.audio,
      };
    } catch (error) {
      console.error('Error getting word info:', error);
      throw error;
    }
  }
}

export const dictionary = new Dictionary();
