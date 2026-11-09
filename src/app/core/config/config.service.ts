import { Injectable } from "@angular/core";
import { AppConfig } from "./app-config.model";

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: AppConfig | null = null;

  async load(): Promise<void> {
    const response = await fetch('/assets/config.json', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Unable to load application configuration: ${response.status}`);
    }

    this.config = await response.json() as AppConfig;
    this.validateConfig(this.config);
  }

  get authApiUrl(): string {
    return this.requireConfig().api.authUrl;
  }

  get documentApiUrl(): string {
    return this.requireConfig().api.documentUrl;
  }

  get addressbookApiUrl(): string {
    return this.requireConfig().api.addressbookUrl;
  }

  private requireConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Application configuration has not been initialized');
    }
    return this.config;
  }

  private validateConfig(config: AppConfig): void {
    if (!config.api?.authUrl) {
      throw new Error('Missing configuration property: api.authUrl');
    }

    if (!config.api?.documentUrl) {
      throw new Error('Missing configuration property: api.documentUrl');
    }

    if (!config.api?.addressbookUrl) {
      throw new Error('Missing configuration property: api.addressbookUrl');
    }
  }

}