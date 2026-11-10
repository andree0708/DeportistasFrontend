import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="rs-page">
      <div class="page-header">
        <h1>Historial de Actividades</h1>
        <a routerLink="/import" class="rs-btn rs-btn--primary rs-btn--sm">
          <span class="material-icons">add</span> Importar
        </a>
      </div>

      @if (loading()) {
        <div class="center-spinner"><mat-spinner diameter="40"/></div>
      } @else {
        <div class="activities-list">
          @for (act of activities(); track act.id) {
            <a [routerLink]="['/activities', act.id]" class="rs-card act-card">
              <div class="act-icon">
                <span class="material-icons">directions_run</span>
              </div>
              <div class="act-info">
                <div class="act-title">{{ act.title || typeLabel(act.activity_type) }}</div>
                <div class="act-date">{{ act.started_at | date:'EEEE d MMM yyyy · HH:mm' }}</div>
                @if (act.is_demo) { <span class="rs-badge rs-badge--warn">DEMO</span> }
              </div>
              <div class="act-stats">
                @if (act.metric) {
                  <div class="act-stat"><span>{{ (act.metric.distance_meters/1000) | number:'1.2-2' }} km</span><small>Distancia</small></div>
                  <div class="act-stat"><span>{{ formatDuration(act.metric.duration_seconds) }}</span><small>Duración</small></div>
                  <div class="act-stat"><span>{{ formatPace(act.metric.avg_pace_sec_per_km) }}</span><small>Ritmo/km</small></div>
                  @if (act.metric.avg_heart_rate_bpm) {
                    <div class="act-stat"><span>{{ act.metric.avg_heart_rate_bpm | number:'1.0-0' }} bpm</span><small>FC media</small></div>
                  }
                }
              </div>
              <span class="material-icons act-arrow">chevron_right</span>
            </a>
          } @empty {
            <div class="rs-card empty-state">
              <span class="material-icons">fitness_center</span>
              <h3>Sin actividades</h3>
              <p>Importa tu primera actividad para comenzar el análisis</p>
              <a routerLink="/import" class="rs-btn rs-btn--primary">Importar ahora</a>
            </div>
          }
        </div>

        @if (total() > pageSize) {
          <div class="pagination">
            <button class="rs-btn rs-btn--ghost rs-btn--sm" [disabled]="page()===1" (click)="prevPage()">← Anterior</button>
            <span>{{ page() }} / {{ Math.ceil(total()/pageSize) }}</span>
            <button class="rs-btn rs-btn--ghost rs-btn--sm" [disabled]="page()*pageSize>=total()" (click)="nextPage()">Siguiente →</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .center-spinner { display: flex; justify-content: center; padding: 60px; }
    .activities-list { display: flex; flex-direction: column; gap: 12px; }
    .act-card { display: flex; align-items: center; gap: 16px; text-decoration: none; cursor: pointer; &:hover .act-title { color: var(--rs-blue-300); } }
    .act-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(26,108,255,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; .material-icons { color: var(--rs-blue-400); font-size: 22px; } }
    .act-info { flex: 1; min-width: 0; }
    .act-title { font-weight: 600; color: var(--rs-text-primary); margin-bottom: 4px; transition: color 0.2s; }
    .act-date { font-size: 0.8rem; color: var(--rs-text-muted); }
    .act-stats { display: flex; gap: 20px; flex-wrap: wrap; }
    .act-stat { text-align: right; span { display: block; font-weight: 600; color: var(--rs-text-primary); } small { font-size: 0.7rem; color: var(--rs-text-muted); } }
    .act-arrow { color: var(--rs-text-muted); }
    .empty-state { text-align: center; padding: 60px; .material-icons { font-size: 56px; color: var(--rs-blue-500); display: block; margin-bottom: 16px; opacity: 0.5; } h3 { margin-bottom: 8px; } p { color: var(--rs-text-secondary); margin-bottom: 20px; } }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 24px; color: var(--rs-text-secondary); }
  `],
})
export class ActivitiesComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(true);
  activities = signal<any[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = 20;
  Math = Math;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<any>('/activities', { page: this.page(), page_size: this.pageSize }).subscribe({
      next: (data) => { this.activities.set(data.items); this.total.set(data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage() { if (this.page() * this.pageSize < this.total()) { this.page.update(p => p + 1); this.load(); } }

  formatPace(secs?: number): string { if (!secs) return '--'; const m = Math.floor(secs/60); const s = Math.round(secs%60); return `${m}:${s.toString().padStart(2,'0')}`; }
  formatDuration(secs?: number): string { if (!secs) return '--'; const h = Math.floor(secs/3600); const m = Math.floor((secs%3600)/60); const s = Math.round(secs%60); return h>0 ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}` : `${m}:${s.toString().padStart(2,'0')}`; }
  typeLabel(type: string): string { const map: Record<string,string> = {run:'Carrera', trail_run:'Trail', treadmill:'Cinta', race:'Competición', interval:'Intervalos', recovery_run:'Recuperación', other:'Actividad'}; return map[type] || 'Actividad'; }
}
