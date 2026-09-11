import Database from 'better-sqlite3';
import { EnvConfig } from '../config';
export declare function getDb(config: EnvConfig): Database.Database;
export declare function closeDb(): void;
