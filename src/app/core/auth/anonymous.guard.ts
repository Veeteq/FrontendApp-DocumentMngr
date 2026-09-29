import { CanActivateFn, Router } from "@angular/router";
import { AuthStore } from "./auth.store";
import { inject } from "@angular/core";

export const anonymousGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  if (authStore.isAuthenticated()) {
    return inject(Router).parseUrl('/home');
  }
  return true;
}