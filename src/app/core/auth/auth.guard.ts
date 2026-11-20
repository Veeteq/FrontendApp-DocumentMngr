import { inject } from "@angular/core";
import { AuthStore } from "./auth.store";
import { CanActivateFn, Router } from "@angular/router";
import { environment } from "../../../environments/environment";

export const authGuard: CanActivateFn = () => {
  if (!environment.authEnabled) return true;
  
  const authStore = inject(AuthStore);  
  if (authStore.isAuthenticated()) return true;

  return inject(Router).parseUrl('/login');
};