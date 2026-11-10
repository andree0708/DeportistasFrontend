import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface CurrentUser {
  id: string;
  email: string;
  full_name?: string;
  is_verified: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API = environment.apiUrl;

  currentUser = signal<CurrentUser | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.checkStoredSession();
  }

  private checkStoredSession(): void {
    const token = this.getAccessToken();
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticated.set(true);
      this.loadCurrentUser().subscribe();
    } else {
      this.clearSession();
    }
  }

  register(email: string, password: string, fullName?: string): Observable<any> {
    return this.http.post(`${this.API}/auth/register`, { email, password, full_name: fullName });
  }

  login(email: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.API}/auth/login`, { email, password }).pipe(
      tap(tokens => this.storeTokens(tokens))
    );
  }

  logout(): void {
    this.http.post(`${this.API}/auth/logout`, {}).subscribe({
      complete: () => this.clearSession()
    });
    this.clearSession();
  }

  refreshToken(): Observable<AuthTokens> {
    const refresh = localStorage.getItem('rs_refresh_token');
    return this.http.post<AuthTokens>(`${this.API}/auth/refresh`, { refresh_token: refresh }).pipe(
      tap(tokens => this.storeTokens(tokens))
    );
  }

  loadCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.API}/auth/me`).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('rs_access_token');
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('rs_access_token', tokens.access_token);
    localStorage.setItem('rs_refresh_token', tokens.refresh_token);
    const expiry = Date.now() + tokens.expires_in * 1000;
    localStorage.setItem('rs_token_expiry', String(expiry));
    this.isAuthenticated.set(true);
    this.loadCurrentUser().subscribe();
  }

  private clearSession(): void {
    localStorage.removeItem('rs_access_token');
    localStorage.removeItem('rs_refresh_token');
    localStorage.removeItem('rs_token_expiry');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
