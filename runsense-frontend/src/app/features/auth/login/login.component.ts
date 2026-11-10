import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-bg">
      <div class="auth-deco">
        <div class="auth-deco__circle auth-deco__circle--1"></div>
        <div class="auth-deco__circle auth-deco__circle--2"></div>
        <div class="auth-deco__circle auth-deco__circle--3"></div>
      </div>

      <div class="auth-card rs-glass animate-fadeInUp">
        <!-- Brand -->
        <div class="auth-brand">
          <div class="auth-brand__icon">
            <span class="material-icons">directions_run</span>
          </div>
          <h1 class="auth-brand__name">RunSense <span class="auth-brand__ai">AI</span></h1>
          <p class="auth-brand__tagline">Tu rendimiento, inteligentemente analizado</p>
        </div>

        <h2 class="auth-title">Bienvenida de vuelta</h2>
        <p class="auth-subtitle">Inicia sesión para ver tu progreso</p>

        @if (errorMsg()) {
          <div class="auth-error">
            <span class="material-icons">error_outline</span>
            {{ errorMsg() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="outline" class="auth-field">
            <mat-label>Correo electrónico</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            <mat-icon matPrefix>mail_outline</mat-icon>
            @if (form.get('email')?.errors?.['required'] && form.get('email')?.touched) {
              <mat-error>El correo es requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="auth-field">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="showPass() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
            <mat-icon matPrefix>lock_outline</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="togglePass()">
              <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.errors?.['required'] && form.get('password')?.touched) {
              <mat-error>La contraseña es requerida</mat-error>
            }
          </mat-form-field>

          <button
            mat-raised-button
            class="auth-btn"
            type="submit"
            [disabled]="loading() || form.invalid">
            @if (loading()) {
              <mat-spinner diameter="20" />
            } @else {
              <span class="material-icons">login</span>
              Iniciar Sesión
            }
          </button>
        </form>

        <div class="auth-footer">
          ¿No tienes cuenta?
          <a routerLink="/auth/register" class="auth-link">Regístrate gratis</a>
        </div>

        <div class="demo-card">
          <div class="demo-card__title">
            <span class="material-icons">science</span>
            Cuenta de prueba
          </div>
          <div class="demo-card__creds">
            <span><strong>Email:</strong> demo&#64;runsense.ai</span>
            <span><strong>Clave:</strong> Demo1234!</span>
          </div>
          <button mat-stroked-button class="demo-card__btn" type="button" (click)="useDemo()">
            <span class="material-icons">bolt</span>
            Usar cuenta demo
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-bg {
      min-height: 100vh;
      background: var(--rs-gradient-hero);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    .auth-deco { position: absolute; inset: 0; pointer-events: none; }
    .auth-deco__circle {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
    }
    .auth-deco__circle--1 { width: 400px; height: 400px; background: var(--rs-blue-500); top: -100px; right: -100px; }
    .auth-deco__circle--2 { width: 300px; height: 300px; background: var(--rs-accent-purple); bottom: -100px; left: -50px; }
    .auth-deco__circle--3 { width: 200px; height: 200px; background: var(--rs-accent-pink); top: 50%; left: 50%; transform: translate(-50%,-50%); opacity: 0.08; }

    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 48px 40px;
      position: relative;
      z-index: 1;
    }

    .auth-brand {
      text-align: center;
      margin-bottom: 32px;
    }
    .auth-brand__icon {
      width: 64px; height: 64px;
      background: var(--rs-gradient-accent);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 8px 32px rgba(26,108,255,0.4);
      .material-icons { color: white; font-size: 32px; }
    }
    .auth-brand__name { font-size: 1.8rem; font-weight: 700; color: var(--rs-text-primary); margin: 0; }
    .auth-brand__ai { background: var(--rs-gradient-accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .auth-brand__tagline { font-size: 0.85rem; color: var(--rs-text-secondary); margin-top: 4px; }

    .auth-title { font-size: 1.4rem; font-weight: 600; color: var(--rs-text-primary); margin-bottom: 4px; text-align: center; }
    .auth-subtitle { font-size: 0.875rem; color: var(--rs-text-secondary); text-align: center; margin-bottom: 28px; }

    .auth-error {
      display: flex; align-items: center; gap: 8px;
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248,113,113,0.3);
      color: var(--rs-error);
      padding: 12px 16px;
      border-radius: var(--rs-radius-sm);
      font-size: 0.875rem;
      margin-bottom: 20px;
    }

    .auth-form { display: flex; flex-direction: column; gap: 4px; }
    .auth-field { width: 100%; }

    .auth-btn {
      width: 100%;
      height: 48px;
      margin-top: 12px;
      background: var(--rs-gradient-accent) !important;
      color: white !important;
      border-radius: 50px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 20px rgba(26,108,255,0.4) !important;
      transition: all 0.2s !important;
      &:hover:not([disabled]) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(26,108,255,0.5) !important; }
    }

    .auth-footer { text-align: center; margin-top: 24px; color: var(--rs-text-secondary); font-size: 0.875rem; }
    .auth-link { color: var(--rs-blue-300); text-decoration: none; font-weight: 600; margin-left: 4px;
      &:hover { color: var(--rs-blue-400); text-decoration: underline; }
    }

    .demo-card {
      margin-top: 20px;
      padding: 16px;
      border: 1px dashed rgba(26,108,255,0.4);
      border-radius: var(--rs-radius-sm);
      background: rgba(26,108,255,0.06);
      display: flex; flex-direction: column; gap: 10px;
    }
    .demo-card__title {
      display: flex; align-items: center; gap: 8px;
      font-weight: 600; font-size: 0.875rem; color: var(--rs-text-primary);
      .material-icons { font-size: 18px; color: var(--rs-blue-300); }
    }
    .demo-card__creds {
      display: flex; flex-direction: column; gap: 2px;
      font-size: 0.8rem; color: var(--rs-text-secondary);
      code, strong { color: var(--rs-text-primary); }
    }
    .demo-card__btn { width: 100%; border-radius: 50px !important; }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal('');
  showPass = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  togglePass(): void { this.showPass.set(!this.showPass()); }

  useDemo(): void {
    this.form.setValue({ email: 'demo@runsense.ai', password: 'Demo1234!' });
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.detail || 'Correo o contraseña incorrectos');
      },
      complete: () => this.loading.set(false),
    });
  }
}
