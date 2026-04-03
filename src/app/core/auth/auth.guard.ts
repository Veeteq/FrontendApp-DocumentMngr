import { inject } from "@angular/core";
import { authStore } from "./auth.store";
import { Router } from "@angular/router";

export const authGuard = () => {  
  if (authStore.isAuthenticated()) return true;

  return inject(Router).parseUrl('/login');

};