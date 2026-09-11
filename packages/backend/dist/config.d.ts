export interface EnvConfig {
    port: number;
    databasePath: string;
    openaiBaseUrl: string;
    openaiApiKey: string;
    openaiModel: string;
    refreshIntervalMinutes: number;
    gdeltApiUrl: string;
    frontendUrl: string;
    nodeEnv: string;
}
export declare function loadConfig(): EnvConfig;
