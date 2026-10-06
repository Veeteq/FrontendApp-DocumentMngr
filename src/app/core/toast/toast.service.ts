import { Injectable, signal } from "@angular/core";
import { Toast } from "./toast.model";

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toast = signal<Toast | null>(null);

  success(message: string) {
    this.show({
      type: 'success',
      message,
    });
  }

  error(message: string) {
    this.show({
      type: 'error',
      message,
    });
  }

  clear(): void {
    this.toast.set(null);
  }
  
  private show(toast: Toast) {
    this.toast.set(toast);
    setTimeout(() => {
      this.toast.set(null);
    }, 3000);
  }
}