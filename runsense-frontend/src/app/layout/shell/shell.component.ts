import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  badge?: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatIconModule,
    MatButtonModule, MatTooltipModule, MatMenuModule, MatDividerModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <!-- SIDENAV -->
      <mat-sidenav
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        class="rs-sidenav">

        <!-- Logo -->
        <div class="rs-nav__logo">
          <div class="rs-nav__logo-icon">
            <span class="material-icons">directions_run</span>
          </div>
          <div class="rs-nav__logo-text">
            <span class="rs-nav__logo-name">RunSense</span>
            <span class="rs-nav__logo-ai">AI</span>
          </div>
        </div>

        <!-- Nav items -->
        <nav class="rs-nav__menu">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="active"
               class="rs-nav__item"
               [matTooltip]="item.label"
               matTooltipPosition="right">
              <span class="material-icons rs-nav__icon">{{ item.icon }}</span>
              <span class="rs-nav__label">{{ item.label }}</span>
              @if (item.badge) {
                <span class="rs-nav__badge">{{ item.badge }}</span>
              }
            </a>
          }
        </nav>

        <!-- Bottom user -->
        <div class="rs-nav__footer">
          <div class="rs-nav__user" [matMenuTriggerFor]="userMenu">
            <div class="rs-nav__avatar">
              {{ userInitial() }}
            </div>
            <div class="rs-nav__user-info">
              <span class="rs-nav__user-name">{{ auth.currentUser()?.full_name || 'Corredora' }}</span>
              <span class="rs-nav__user-email">{{ auth.currentUser()?.email }}</span>
            </div>
          </div>
        </div>
      </mat-sidenav>

      <!-- MAIN CONTENT -->
      <mat-sidenav-content class="rs-content">
        <!-- TOP BAR -->
        <header class="rs-topbar">
          <button mat-icon-button (click)="sidenav.toggle()" class="rs-topbar__menu-btn">
            <mat-icon>menu</mat-icon>
          </button>
          <div class="rs-topbar__title">{{ pageTitle() }}</div>
          <div class="rs-topbar__actions">
            <button mat-icon-button [routerLink]="'/import'" matTooltip="Importar actividad">
              <mat-icon>upload_file</mat-icon>
            </button>
            <button mat-icon-button [matMenuTriggerFor]="userMenu" matTooltip="Perfil">
              <div class="rs-topbar__avatar">{{ userInitial() }}</div>
            </button>
          </div>
        </header>

        <!-- PAGE -->
        <main class="rs-main">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>

    <!-- User Menu -->
    <mat-menu #userMenu="matMenu" class="rs-user-menu">
      <button mat-menu-item [routerLink]="'/profile'">
        <mat-icon>person</mat-icon> Mi Perfil
      </button>
      <button mat-menu-item [routerLink]="'/settings'">
        <mat-icon>settings</mat-icon> Configuración
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon> Cerrar Sesión
      </button>
    </mat-menu>
  `,
  styles: [`
    .shell-container { height: 100vh; background: var(--rs-bg-primary); }

    .rs-sidenav {
      width: 260px;
      background: var(--rs-bg-secondary) !important;
      border-right: 1px solid var(--rs-border) !important;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    .rs-nav__logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 28px 20px 20px;
      border-bottom: 1px solid var(--rs-border);
    }

    .rs-nav__logo-icon {
      width: 44px; height: 44px;
      background: var(--rs-gradient-accent);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(26, 108, 255, 0.4);
      animation: glowPulse 3s ease-in-out infinite;
      .material-icons { color: white; font-size: 24px; }
    }

    .rs-nav__logo-name { display: block; font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--rs-text-primary); }
    .rs-nav__logo-ai { font-size: 0.65rem; letter-spacing: 3px; color: var(--rs-blue-400); text-transform: uppercase; font-weight: 600; }

    .rs-nav__menu {
      flex: 1;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }

    .rs-nav__item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: 12px;
      text-decoration: none;
      color: var(--rs-text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
      position: relative;

      &:hover { background: rgba(255,255,255,0.05); color: var(--rs-text-primary); }

      &.active {
        background: rgba(26, 108, 255, 0.15);
        color: var(--rs-blue-300);
        border: 1px solid rgba(26, 108, 255, 0.2);
        .rs-nav__icon { color: var(--rs-blue-400); }
      }
    }

    .rs-nav__icon { font-size: 20px; }
    .rs-nav__badge {
      margin-left: auto;
      background: var(--rs-accent-pink);
      color: white;
      border-radius: 10px;
      padding: 2px 8px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .rs-nav__footer {
      padding: 16px 12px;
      border-top: 1px solid var(--rs-border);
    }

    .rs-nav__user {
      display: flex; align-items: center; gap: 12px;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s;
      &:hover { background: rgba(255,255,255,0.05); }
    }

    .rs-nav__avatar, .rs-topbar__avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: var(--rs-gradient-accent);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.95rem; color: white;
      box-shadow: 0 2px 8px rgba(26,108,255,0.4);
    }

    .rs-nav__user-name { display: block; font-size: 0.85rem; font-weight: 600; color: var(--rs-text-primary); }
    .rs-nav__user-email { font-size: 0.72rem; color: var(--rs-text-muted); }

    /* TOP BAR */
    .rs-content { display: flex; flex-direction: column; background: var(--rs-bg-primary); }

    .rs-topbar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 24px;
      height: 64px;
      background: var(--rs-bg-secondary);
      border-bottom: 1px solid var(--rs-border);
      position: sticky; top: 0; z-index: 100;
    }

    .rs-topbar__title { flex: 1; font-family: 'Inter'; font-weight: 600; font-size: 1rem; color: var(--rs-text-primary); }
    .rs-topbar__actions { display: flex; align-items: center; gap: 8px; }
    .rs-topbar__menu-btn { display: none; }

    .rs-main {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    @media (max-width: 768px) {
      .rs-topbar__menu-btn { display: flex; }
    }
  `],
})
export class ShellComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  isMobile = signal(window.innerWidth < 768);

  navItems: NavItem[] = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/activities', icon: 'fitness_center', label: 'Actividades' },
    { path: '/import', icon: 'upload_file', label: 'Importar' },
    { path: '/predictions', icon: 'insights', label: 'Predicciones' },
    { path: '/recovery', icon: 'bedtime', label: 'Recuperación' },
    { path: '/recommendations', icon: 'lightbulb', label: 'Recomendaciones' },
    { path: '/simulator', icon: 'science', label: 'Simulador' },
    { path: '/profile', icon: 'person', label: 'Mi Perfil' },
    { path: '/settings', icon: 'settings', label: 'Configuración' },
  ];

  pageTitle(): string {
    const path = this.router.url.split('/')[1];
    const map: Record<string, string> = {
      dashboard: 'Dashboard', activities: 'Actividades', import: 'Importar Actividad',
      predictions: 'Predicciones', recovery: 'Recuperación', recommendations: 'Recomendaciones',
      simulator: 'Simulador de Escenarios', profile: 'Mi Perfil', settings: 'Configuración',
    };
    return map[path] || 'RunSense AI';
  }

  userInitial(): string {
    const user = this.auth.currentUser();
    if (!user) return 'R';
    return (user.full_name || user.email).charAt(0).toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
