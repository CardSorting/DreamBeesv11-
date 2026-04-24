import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export interface GenerationRecord {
  id: string;
  prompt?: string;
  imageUrl?: string;
  modelId?: string;
  params?: Record<string, unknown>;
  createdAt?: number;
}

function requireString(value: unknown, field: string, maxLength = 2048): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function safeJsonParse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export class LiteDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const finalPath = dbPath || path.join(app.getPath('userData'), 'lite.sqlite');
    this.db = new Database(finalPath, { timeout: 5000 });
    this.init();
  }

  private init() {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    this.db.pragma('foreign_keys = ON');
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

  public saveGeneration(data: GenerationRecord) {
    const id = requireString(data?.id, 'id', 256);
    const prompt = typeof data.prompt === 'string' ? data.prompt.slice(0, 10000) : '';
    const imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl.slice(0, 4096) : '';
    const modelId = typeof data.modelId === 'string' ? data.modelId.slice(0, 256) : '';
    const createdAt = Number.isFinite(data.createdAt) ? Number(data.createdAt) : Date.now();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO generations (id, prompt, imageUrl, modelId, params, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      prompt,
      imageUrl,
      modelId,
      JSON.stringify(data.params || {}),
      createdAt
    );
  }

  public getGenerations(limit: number = 50) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const stmt = this.db.prepare(`SELECT * FROM generations ORDER BY createdAt DESC LIMIT ?`);
    return stmt.all(safeLimit).map((g: any) => ({
      ...g,
      params: safeJsonParse(g.params)
    }));
  }

  public setSetting(key: string, value: any) {
    const safeKey = requireString(key, 'key', 128);
    const stmt = this.db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
    stmt.run(safeKey, JSON.stringify(value));
  }

  public getSetting(key: string) {
    const safeKey = requireString(key, 'key', 128);
    const stmt = this.db.prepare(`SELECT value FROM settings WHERE key = ?`);
    const row = stmt.get(safeKey) as any;
    return row ? safeJsonParse(row.value) : null;
  }

  public close() {
    if (this.db.open) this.db.close();
  }
}
