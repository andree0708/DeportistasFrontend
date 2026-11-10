import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, NgxEchartsDirective],
  template: `
    <div class="rs-page">
      <!-- Header -->
      <div class="dash-header animate-fadeInUp">
        <div>
          <h1 class="dash-greeting">
            Hola, <span class="dash-name">{{ auth.currentUser()?.full_name || 'Corredora' }}</span> 👋
          </h1>
          <p class="dash-sub">Aquí está tu resumen de rendimiento</p>
        </div>
        <div class="dash-header__actions">
          <a routerLink="/import" class="rs-btn rs-btn--primary rs-btn--sm">
            <span class="material-icons">upload_file</span> Importar actividad
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="dash-loading">
          <mat-spinner diameter="48" />
          <p>Cargando tu progreso...</p>
        </div>
      } @else if (!summary()) {
        <div class="dash-empty">
          <span class="material-icons dash-empty__icon">directions_run</span>
          <h3>¡Comienza tu aventura!</h3>
          <p>Crea tu perfil e importa tu primera actividad para ver el análisis.</p>
          <div class="dash-empty__actions">
            <a routerLink="/profile" class="rs-btn rs-btn--primary">Crear Perfil</a>
            <a routerLink="/import" class="rs-btn rs-btn--outline">Importar actividad</a>
          </div>
        </div>
      } @else {
        <!-- Stats Row -->
        <div class="rs-grid-4 animate-fadeInUp">
          <div class="rs-card rs-card--accent">
            <div class="rs-stat">
              <div class="rs-stat__value">{{ summary()?.weekly?.distance_km | number:'1.0-1' }}<span class="rs-stat__unit"> km</span></div>
              <div class="rs-stat__label">Esta semana</div>
            </div>
          </div>
          <div class="rs-card rs-card--pink">
            <div class="rs-stat">
              <div class="rs-stat__value">{{ summary()?.monthly?.distance_km | number:'1.0-0' }}<span class="rs-stat__unit"> km</span></div>
              <div class="rs-stat__label">Este mes</div>
            </div>
          </div>
          <div class="rs-card rs-card--purple">
            <div class="rs-stat">
              <div class="rs-stat__value">{{ formatPace(summary()?.monthly?.avg_pace_sec_per_km) }}</div>
              <div class="rs-stat__label">Ritmo promedio</div>
            </div>
          </div>
          <div class="rs-card">
            <div class="rs-stat">
              <div class="rs-stat__value">{{ summary()?.total_activities || 0 }}</div>
              <div class="rs-stat__label">Actividades totales</div>
            </div>
          </div>
        </div>

        <!-- Charts + Recent -->
        <div class="dash-grid">
          <!-- Evolución -->
          <div class="rs-card dash-chart-card">
            <div class="dash-card-header">
              <h3>Evolución del rendimiento</h3>
              <span class="rs-badge rs-badge--blue">Últimos 90 días</span>
            </div>
            @if (evolutionChart()) {
              <div echarts [options]="evolutionChart()!" class="rs-chart rs-chart--lg"></div>
            } @else {
              <div class="dash-no-data"><span class="material-icons">show_chart</span><p>Importa actividades para ver tu evolución</p></div>
            }
          </div>

          <!-- Recientes + Predicción -->
          <div class="dash-side">
            <!-- Última predicción -->
            @if (summary()?.last_prediction) {
              <div class="rs-card rs-card--accent">
                <div class="dash-card-header">
                  <h3>Última predicción</h3>
                  <span class="rs-badge rs-badge--purple">IA</span>
                </div>
                <div class="dash-prediction">
                  <div class="dash-prediction__dist">{{ summary()?.last_prediction?.target_distance_km }} km</div>
                  <div class="dash-prediction__time">{{ formatTime(summary()?.last_prediction?.predicted_time_seconds) }}</div>
                  <a routerLink="/predictions" class="rs-btn rs-btn--ghost rs-btn--sm">Ver más</a>
                </div>
              </div>
            }

            <!-- Recomendaciones -->
            @if (summary()?.unread_recommendations > 0) {
              <div class="rs-card rs-card--pink">
                <div class="dash-rec">
                  <span class="material-icons">lightbulb</span>
                  <div>
                    <div class="dash-rec__count">{{ summary()?.unread_recommendations }} recomendaciones</div>
                    <a routerLink="/recommendations" class="auth-link">Ver recomendaciones →</a>
                  </div>
                </div>
              </div>
            }

            <!-- Actividades recientes -->
            <div class="rs-card">
              <div class="dash-card-header">
                <h3>Actividades recientes</h3>
                <a routerLink="/activities" class="rs-btn rs-btn--ghost rs-btn--sm">Ver todas</a>
              </div>
              <div class="dash-activities">
                @for (act of summary()?.recent_activities; track act.id) {
                  <a [routerLink]="['/activities', act.id]" class="dash-act-item">
                    <div class="dash-act-icon">
                      <span class="material-icons">directions_run</span>
                    </div>
                    <div class="dash-act-info">
                      <div class="dash-act-title">{{ act.title || 'Carrera' }}</div>
                      <div class="dash-act-meta">
                        {{ act.distance_km | number:'1.1-1' }} km · {{ formatPace(act.avg_pace_sec_per_km) }}/km
                      </div>
                    </div>
                    <div class="dash-act-date">{{ act.started_at | date:'d MMM' }}</div>
                  </a>
                } @empty {
                  <div class="dash-no-data"><p>Aún no hay actividades</p></div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dash-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
    .dash-greeting { font-size: 2rem; color: var(--rs-text-primary); margin-bottom: 4px; }
    .dash-name { background: var(--rs-gradient-accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .dash-sub { color: var(--rs-text-secondary); font-size: 0.9rem; }

    .dash-loading { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0; color: var(--rs-text-secondary); }

    .dash-empty { text-align: center; padding: 80px 24px;
      .dash-empty__icon { font-size: 72px; color: var(--rs-blue-500); display: block; margin-bottom: 16px; opacity: 0.5; }
      h3 { margin-bottom: 8px; }
      p { color: var(--rs-text-secondary); margin-bottom: 24px; }
      .dash-empty__actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    }

    .dash-grid { display: grid; grid-template-columns: 1fr 380px; gap: 20px; margin-top: 20px;
      @media (max-width: 1100px) { grid-template-columns: 1fr; }
    }

    .dash-chart-card, .dash-side { display: flex; flex-direction: column; gap: 16px; }
    .dash-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .dash-no-data { display: flex; flex-direction: column; align-items: center; padding: 40px; color: var(--rs-text-muted); .material-icons { font-size: 40px; margin-bottom: 8px; } }

    .dash-prediction { text-align: center; padding: 12px 0;
      .dash-prediction__dist { font-size: 1rem; color: var(--rs-text-secondary); margin-bottom: 4px; }
      .dash-prediction__time { font-size: 2rem; font-weight: 700; background: var(--rs-gradient-accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 12px; }
    }

    .dash-rec { display: flex; align-items: center; gap: 16px; .material-icons { font-size: 32px; color: var(--rs-accent-pink); }
      .dash-rec__count { font-weight: 600; color: var(--rs-text-primary); }
      .auth-link { color: var(--rs-blue-300); font-size: 0.85rem; text-decoration: none; &:hover { text-decoration: underline; } }
    }

    .dash-activities { display: flex; flex-direction: column; gap: 8px; }
    .dash-act-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 10px; text-decoration: none; transition: background 0.2s; &:hover { background: rgba(255,255,255,0.04); } }
    .dash-act-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(26,108,255,0.15); display: flex; align-items: center; justify-content: center; .material-icons { color: var(--rs-blue-400); font-size: 18px; } }
    .dash-act-info { flex: 1; }
    .dash-act-title { font-size: 0.875rem; font-weight: 500; color: var(--rs-text-primary); }
    .dash-act-meta { font-size: 0.75rem; color: var(--rs-text-secondary); }
    .dash-act-date { font-size: 0.75rem; color: var(--rs-text-muted); }
  `],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  loading = signal(true);
  summary = signal<any>(null);
  evolutionChart = signal<EChartsOption | null>(null);

  ngOnInit(): void {
    this.api.get<any>('/dashboard/summary').subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
        this.loadEvolution();
      },
      error: () => this.loading.set(false),
    });
  }

  loadEvolution(): void {
    this.api.get<any[]>('/dashboard/evolution', { days: 90 }).subscribe({
      next: (data) => {
        if (!data?.length) return;
        const dates = data.map(d => d.date);
        const paces = data.map(d => d.avg_pace_sec_per_km ? +(d.avg_pace_sec_per_km / 60).toFixed(2) : null);
        const dists = data.map(d => d.distance_km);

        this.evolutionChart.set({
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis', backgroundColor: '#0d1f3c', borderColor: '#1a3050', textStyle: { color: '#f0f4ff' } },
          legend: { data: ['Ritmo (min/km)', 'Distancia (km)'], textStyle: { color: '#8ba5cc' }, bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
          xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#1a3050' } }, axisLabel: { color: '#8ba5cc', fontSize: 11 } },
          yAxis: [
            { type: 'value', name: 'Ritmo', axisLabel: { color: '#8ba5cc' }, splitLine: { lineStyle: { color: '#1a3050' } } },
            { type: 'value', name: 'Distancia', axisLabel: { color: '#8ba5cc' } },
          ],
          series: [
            {
              name: 'Ritmo (min/km)', type: 'line', data: paces,
              smooth: true, symbol: 'circle', symbolSize: 6,
              lineStyle: { color: '#4d90fe', width: 2 },
              itemStyle: { color: '#4d90fe' },
              areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(77,144,254,0.3)' }, { offset: 1, color: 'rgba(77,144,254,0)' }] } },
            },
            {
              name: 'Distancia (km)', type: 'bar', yAxisIndex: 1, data: dists,
              barMaxWidth: 20,
              itemStyle: { color: 'rgba(167,139,250,0.4)', borderRadius: [4, 4, 0, 0] },
            },
          ],
        });
      },
    });
  }

  formatPace(secs?: number): string {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(secs?: number): string {
    if (!secs) return '--:--:--';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.round(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
