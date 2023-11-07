import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';
const TIME_LOGIN = 'time-login';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  constructor(private router: Router) {}

  signOut(): void {
    window.sessionStorage.clear();
  }

  public saveToken(token: string): void {
    window.sessionStorage.removeItem(TOKEN_KEY);

    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 1); // Token berlaku selama 1 jam
    const tokenData = {
      token: token,
      expiration: tokenExpiration.getTime(),
    };
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
  }

  public getToken(): string | null {
    const storedTokenData = JSON.parse(sessionStorage.getItem(TOKEN_KEY));
    if (storedTokenData) {
      const tokenExpiration = new Date(storedTokenData.expiration);
      if (tokenExpiration > new Date()) {
        // Token masih berlaku
        return storedTokenData.token;
      } else {
        // Token sudah kadaluwarsa, hapus dari session storage dan arahkan ke halaman login
        sessionStorage.removeItem(TOKEN_KEY);
        this.router.navigate(['/auth/signin']);
      }
    } else {
      // Tidak ada token di session storage, arahkan ke halaman login
      this.router.navigate(['/auth/signin']);
    }
  }

  // public checkToken(): boolean {
  //   const tokenTime = window.sessionStorage.getItem(TIME_LOGIN);
  //   if (tokenTime) {
  //     const time = new Date(tokenTime);
  //     const now = new Date();
  //     const diff = now.getTime() - time.getTime();
  //     const diffMinutes = Math.floor(diff / 60000);
  //     if (diffMinutes > 60) {
  //       window.sessionStorage.clear();
  //       return false;
  //     }
  //     return true;
  //   }

  // }

  public saveUser(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public getUser(): any {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }

    return {};
  }
}
