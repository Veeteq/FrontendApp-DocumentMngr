import { inject } from "@angular/core";
import { AuthStore } from "./auth.store";
import { Router } from "@angular/router";

export const authGuard = () => {
  const authStore = inject(AuthStore);  
  if (authStore.isAuthenticated()) return true;

  return inject(Router).parseUrl('/login');

};