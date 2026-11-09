import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { httpErrorInterceptor } from './core/auth/http-error.interceptor';
import { requestContextInterceptor } from './core/http/request-context.interceptor';
import { ConfigService } from './core/config/config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      return configService.load();
    }),
    provideHttpClient(
      withInterceptors([httpErrorInterceptor, authInterceptor, requestContextInterceptor]),
    ),
    provideRouter(routes),
  ],
};
