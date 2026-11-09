export interface ApiConfig {
  authUrl: string;
  documentUrl: string;
  addressbookUrl: string;
}

export interface AppConfig {
  api: ApiConfig;
}