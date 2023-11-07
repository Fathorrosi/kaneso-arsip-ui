import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { environment } from 'src/environments/environment';

const AUTH_API = environment.apiUrl + '/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService
  ) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'login',
      {
        email,
        password,
      },
      httpOptions
    );
  }

  logout(): void {
    this.tokenStorage.signOut();
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'signup',
      {
        username,
        email,
        password,
      },
      httpOptions
    );
  }

  getHeader() {
    const accessToken = this.tokenStorage.getToken();
    if (!accessToken) {
      console.error('Token akses tidak ditemukan.');
      return new HttpHeaders(); // Mengembalikan HttpHeaders kosong
    }
    return new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
  }
  
}
