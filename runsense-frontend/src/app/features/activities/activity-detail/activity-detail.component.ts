import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ApiService } from '../../../core/services/api.service';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, NgxEchartsDirective],
  template: `
    <div class="rs-page">
      <div class="page-header">
        <a routerLink="/activities" class="rs-btn rs-btn--ghost rs-btn--sm">
          <span class="material-icons">arrow_back</span> Volver
        </a>
        <h1>{{ activity()?.title || 'Detalle de Actividad' }}</h1>
      </div>

      @if (activity()) {
        <div class="rs-grid-4">
          <div class="rs-card rs-card--accent"><div class="rs-stat"><div class="rs-stat__value">{{ km() }}<span class="rs-stat__unit"> km</span></div><div class="rs-stat__label">Distancia</div></div></div>
          <div class="rs-card"><div class="rs-stat"><div class="rs-stat__value">{{ duration() }}</div><div class="rs-stat__label">Duración</div></div></div>
          <div class="rs-card rs-card--pink"><div class="rs-stat"><div class="rs-stat__value">{{ pace() }}<span class="rs-stat__unit">/km</span></div><div class="rs-stat__label">Ritmo medio</div></div></div>
          @if (activity()?.metric?.avg_heart_rate_bpm) {
            <div class="rs-card rs-card--purple"><div class="rs-stat"><div class="rs-stat__value">{{ activity()?.metric?.avg_heart_rate_bpm | number:'1.0-0' }}<span class="rs-stat__unit"> bpm</span></div><div class="rs-stat__label">FC media</div></div></div>
          }
        </div>

        @if (hrChart()) {
          <div class="rs-card" style="margin-top:20px">
            <h3 style="margin-bottom:16px">Frecuencia Cardíaca</h3>
            <div echarts [options]="hrChart()!" class="rs-chart rs-chart--lg"></div>
          </div>
        }

        @if (paceChart()) {
          <div class="rs-card" style="margin-top:16px">
            <h3 style="margin-bottom:16px">Ritmo por kilómetro</h3>
            <div echarts [options]="paceChart()!" class="rs-chart rs-chart--lg"></div>
          </div>
        }
      }
    </div>
  `,
  styles: [`.page-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }`],
})
export class ActivityDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  activity = signal<any>(null);
  hrChart = signal<EChartsOption | null>(null);
  paceChart = signal<EChartsOption | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`/activities/${id}`).subscribe(a => {
      this.activity.set(a);
      this.loadSamples(id);
    });
  }

  loadSamples(id: string) {
    this.api.get<any>(`/activities/${id}/samples`).subscribe(s => {
      if (s.heart_rate_samples?.length) {
        this.hrChart.set({
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis', backgroundColor: '#0d1f3c', borderColor: '#1a3050', textStyle: { color: '#f0f4ff' } },
          xAxis: { type: 'value', name: 'Tiempo (s)', axisLabel: { color: '#8ba5cc' }, axisLine: { lineStyle: { color: '#1a3050' } } },
          yAxis: { type: 'value', name: 'bpm', axisLabel: { color: '#8ba5cc' }, splitLine: { lineStyle: { color: '#1a3050' } } },
          series: [{ type: 'line', data: s.heart_rate_samples.map((x: any) => [x.t, x.hr]), smooth: true, lineStyle: { color: '#e879a0', width: 2 }, areaStyle: { color: 'rgba(232,121,160,0.15)' }, symbol: 'none' }],
        });
      }
      if (s.pace_samples?.length) {
        this.paceChart.set({
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis', backgroundColor: '#0d1f3c', borderColor: '#1a3050', textStyle: { color: '#f0f4ff' } },
          xAxis: { type: 'value', name: 'Tiempo (s)', axisLabel: { color: '#8ba5cc' }, axisLine: { lineStyle: { color: '#1a3050' } } },
          yAxis: { type: 'value', name: 's/km', inverse: true, axisLabel: { color: '#8ba5cc' }, splitLine: { lineStyle: { color: '#1a3050' } } },
          series: [{ type: 'line', data: s.pace_samples.map((x: any) => [x.t, x.pace]), smooth: true, lineStyle: { color: '#4d90fe', width: 2 }, symbol: 'none', areaStyle: { color: 'rgba(77,144,254,0.15)' } }],
        });
      }
    });
  }

  km() { const m = this.activity()?.metric?.distance_meters; return m ? (m/1000).toFixed(2) : '--'; }
  duration() { const s = this.activity()?.metric?.duration_seconds; if(!s) return '--'; const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=Math.round(s%60); return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`; }
  pace() { const p = this.activity()?.metric?.avg_pace_sec_per_km; if(!p) return '--'; return `${Math.floor(p/60)}:${String(Math.round(p%60)).padStart(2,'0')}`; }
}
