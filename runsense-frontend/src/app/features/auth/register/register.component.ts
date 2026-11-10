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
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-bg">
      <div class="auth-deco">
        <div class="auth-deco__circle auth-deco__circle--1"></div>
        <div class="auth-deco__circle auth-deco__circle--2"></div>
      </div>
      <div class="auth-card rs-glass animate-fadeInUp">
        <div class="auth-brand">
          <div class="auth-brand__icon"><span class="material-icons">directions_run</span></div>
          <h1 class="auth-brand__name">RunSense <span class="auth-brand__ai">AI</span></h1>
        </div>
        <h2 class="auth-title">Crea tu cuenta</h2>
        <p class="auth-subtitle">Comienza a analizar tu rendimiento hoy</p>

        @if (errorMsg()) {
          <div class="auth-error"><span class="material-icons">error_outline</span>{{ errorMsg() }}</div>
        }
        @if (successMsg()) {
          <div class="auth-success"><span class="material-icons">check_circle</span>{{ successMsg() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="outline" class="auth-field">
            <mat-label>Nombre completo</mat-label>
            <input matInput formControlName="fullName" autocomplete="name" />
            <mat-icon matPrefix>person_outline</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="auth-field">
            <mat-label>Correo electrónico</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            <mat-icon matPrefix>mail_outline</mat-icon>
            @if (form.get('email')?.errors?.['email'] && form.get('email')?.touched) {
              <mat-error>Ingresa un correo válido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="auth-field">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="showPass() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" />
            <mat-icon matPrefix>lock_outline</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="togglePass()">
              <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>Mínimo 8 caracteres, una mayúscula y un número</mat-hint>
          </mat-form-field>

          <button mat-raised-button class="auth-btn" type="submit" [disabled]="loading() || form.invalid">
            @if (loading()) { <mat-spinner diameter="20" /> }
            @else { <span class="material-icons">person_add</span> Crear Cuenta }
          </button>
        </form>

        <div class="auth-footer">
          ¿Ya tienes cuenta?
          <a routerLink="/auth/login" class="auth-link">Inicia sesión</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-bg { min-height: 100vh; background: var(--rs-gradient-hero); display: flex; align-items: center; justify-content: center; padding: 24px; position: relative; overflow: hidden; }
    .auth-deco { position: absolute; inset: 0; pointer-events: none; }
    .auth-deco__circle { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.12; }
    .auth-deco__circle--1 { width: 350px; height: 350px; background: var(--rs-accent-purple); top: -80px; left: -80px; }
    .auth-deco__circle--2 { width: 300px; height: 300px; background: var(--rs-blue-500); bottom: -60px; right: -60px; }
    .auth-card { width: 100%; max-width: 440px; padding: 48px 40px; position: relative; z-index: 1; }
    .auth-brand { text-align: center; margin-bottom: 24px; }
    .auth-brand__icon { width: 56px; height: 56px; background: var(--rs-gradient-accent); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 6px 24px rgba(26,108,255,0.4); .material-icons { color: white; font-size: 28px; } }
    .auth-brand__name { font-size: 1.5rem; font-weight: 700; color: var(--rs-text-primary); margin: 0; }
    .auth-brand__ai { background: var(--rs-gradient-accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .auth-title { font-size: 1.3rem; font-weight: 600; color: var(--rs-text-primary); margin-bottom: 4px; text-align: center; }
    .auth-subtitle { font-size: 0.875rem; color: var(--rs-text-secondary); text-align: center; margin-bottom: 24px; }
    .auth-error { display: flex; align-items: center; gap: 8px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: var(--rs-error); padding: 12px 16px; border-radius: var(--rs-radius-sm); font-size: 0.875rem; margin-bottom: 16px; }
    .auth-success { display: flex; align-items: center; gap: 8px; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); color: var(--rs-success); padding: 12px 16px; border-radius: var(--rs-radius-sm); font-size: 0.875rem; margin-bottom: 16px; }
    .auth-form { display: flex; flex-direction: column; gap: 4px; }
    .auth-field { width: 100%; }
    .auth-btn { width: 100%; height: 48px; margin-top: 12px; background: var(--rs-gradient-accent) !important; color: white !important; border-radius: 50px !important; font-size: 1rem !important; font-weight: 600 !important; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .auth-footer { text-align: center; margin-top: 24px; color: var(--rs-text-secondary); font-size: 0.875rem; }
    .auth-link { color: var(--rs-blue-300); text-decoration: none; font-weight: 600; margin-left: 4px; &:hover { text-decoration: underline; } }
  `],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');
  showPass = signal(false);

  form = this.fb.group({
    fullName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  togglePass(): void { this.showPass.set(!this.showPass()); }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');
    const { email, password, fullName } = this.form.value;
    this.auth.register(email!, password!, fullName || undefined).subscribe({
      next: () => {
        this.auth.login(email!, password!).subscribe({
          next: () => this.router.navigate(['/profile']),
          error: () => this.router.navigate(['/auth/login']),
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.detail || 'Error al crear la cuenta');
      },
    });
  }
}
