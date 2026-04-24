import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export class LiteDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const finalPath = dbPath || path.join(app.getPath('userData'), 'lite.sqlite');
    this.db = new Database(finalPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS generations (
        id TEXT PRIMARY KEY,
        prompt TEXT,
        imageUrl TEXT,
        modelId TEXT,
        params TEXT, -- JSON
        createdAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT -- JSON
      );
    `);
  }

  public saveGeneration(data: any) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO generations (id, prompt, imageUrl, modelId, params, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      data.id, 
      data.prompt, 
      data.imageUrl, 
      data.modelId, 
      JSON.stringify(data.params || {}), 
      data.createdAt || Date.now()
    );
  }

  public getGenerations(limit: number = 50) {
    const stmt = this.db.prepare(`SELECT * FROM generations ORDER BY createdAt DESC LIMIT ?`);
    return stmt.all(limit).map((g: any) => ({
      ...g,
      params: JSON.parse(g.params)
    }));
  }

  public setSetting(key: string, value: any) {
    const stmt = this.db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
    stmt.run(key, JSON.stringify(value));
  }

  public getSetting(key: string) {
    const stmt = this.db.prepare(`SELECT value FROM settings WHERE key = ?`);
    const row = stmt.get(key) as any;
    return row ? JSON.parse(row.value) : null;
  }
}
