import { inject } from "@angular/core";
import { AuthStore } from "./auth.store";
import { CanActivateFn, Router } from "@angular/router";

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);  
  if (authStore.isAuthenticated()) return true;

  return inject(Router).parseUrl('/login');
};