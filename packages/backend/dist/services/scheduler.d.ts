import { EnvConfig } from '../config';
export declare function startScheduler(config: EnvConfig, refreshFn: () => Promise<unknown>): void;
export declare function stopScheduler(): void;
