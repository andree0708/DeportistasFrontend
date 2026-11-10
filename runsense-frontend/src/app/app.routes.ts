import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'activities', loadComponent: () => import('./features/activities/activities.component').then(m => m.ActivitiesComponent) },
      { path: 'activities/:id', loadComponent: () => import('./features/activities/activity-detail/activity-detail.component').then(m => m.ActivityDetailComponent) },
      { path: 'import', loadComponent: () => import('./features/import/import.component').then(m => m.ImportComponent) },
      { path: 'predictions', loadComponent: () => import('./features/predictions/predictions.component').then(m => m.PredictionsComponent) },
      { path: 'recovery', loadComponent: () => import('./features/recovery/recovery.component').then(m => m.RecoveryComponent) },
      { path: 'recommendations', loadComponent: () => import('./features/recommendations/recommendations.component').then(m => m.RecommendationsComponent) },
      { path: 'simulator', loadComponent: () => import('./features/simulator/simulator.component').then(m => m.SimulatorComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
