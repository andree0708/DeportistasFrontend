import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ApiService } from '../../core/services/api.service';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-recovery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatTabsModule, MatIconModule, NgxEchartsDirective],
  template: `
    <div class="rs-page">
      <h1>Recuperación y Descanso</h1>
      <p class="page-sub">Monitorea tus métricas de recuperación para optimizar el rendimiento</p>

      <!-- AI Analysis Button -->
      <div style="margin-bottom:20px">
        <button class="rs-btn rs-btn--primary" (click)="analyzeRecovery()" [disabled]="analyzing()">
          @if (analyzing()) { <span>Analizando...</span> } @else { <span class="material-icons">psychology</span> Analizar recuperación (IA) }
        </button>
      </div>

      <!-- AI Signals -->
      @if (analysis()) {
        <div class="rec-signals">
          @for (s of analysis()?.signals; track s.signal_type) {
            <div class="rs-card rec-signal" [style.borderLeftColor]="signalColor(s.severity)">
              <div class="rec-signal__header">
                <span class="material-icons">{{ signalIcon(s.signal_type) }}</span>
                <span>{{ s.description }}</span>
              </div>
              <div class="rec-signal__rec">💡 {{ s.recommendation }}</div>
            </div>
          } @empty {
            <div class="rs-card"><p style="color:var(--rs-success)">✅ No se detectaron señales de alerta en tu recuperación.</p></div>
          }
        </div>
      }

      <mat-tab-group class="rec-tabs">
        <mat-tab label="Registrar Sueño">
          <div class="tab-content">
            <div class="rs-card">
              <h3 style="margin-bottom:20px">Registrar descanso</h3>
              <form [formGroup]="sleepForm" (ngSubmit)="logSleep()" class="rec-form">
                <mat-form-field appearance="outline"><mat-label>Fecha</mat-label><input matInput type="date" formControlName="sleep_date" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Horas de sueño</mat-label><input matInput type="number" step="0.5" formControlName="sleep_hours" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Calidad (0-100)</mat-label><input matInput type="number" min="0" max="100" formControlName="sleep_quality_score" /></mat-form-field>
                <button mat-raised-button class="rs-btn rs-btn--primary" type="submit">Guardar</button>
              </form>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Métricas de Recuperación">
          <div class="tab-content">
            <div class="rs-card">
              <h3 style="margin-bottom:20px">Registrar métricas</h3>
              <form [formGroup]="recForm" (ngSubmit)="logRecovery()" class="rec-form">
                <mat-form-field appearance="outline"><mat-label>Fecha</mat-label><input matInput type="date" formControlName="metric_date" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>FC en reposo (bpm)</mat-label><input matInput type="number" formControlName="resting_heart_rate_bpm" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>HRV (ms)</mat-label><input matInput type="number" formControlName="hrv_ms" /></mat-form-field>
                <button mat-raised-button class="rs-btn rs-btn--primary" type="submit">Guardar</button>
              </form>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Historial">
          <div class="tab-content">
            @if (hrChart()) {
              <div class="rs-card"><h3 style="margin-bottom:16px">FC en Reposo</h3><div echarts [options]="hrChart()!" class="rs-chart"></div></div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-sub { color: var(--rs-text-secondary); margin-bottom: 20px; }
    .rec-signals { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .rec-signal { border-left: 4px solid var(--rs-blue-500); padding-left: 16px; }
    .rec-signal__header { display: flex; align-items: center; gap: 8px; font-weight: 500; margin-bottom: 6px; .material-icons { font-size: 20px; } }
    .rec-signal__rec { font-size: 0.85rem; color: var(--rs-text-secondary); }
    .rec-tabs { margin-top: 20px; }
    .tab-content { padding: 20px 0; }
    .rec-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; @media(max-width:600px){ grid-template-columns:1fr; } }
  `],
})
export class RecoveryComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  analyzing = signal(false);
  analysis = signal<any>(null);
  hrChart = signal<EChartsOption | null>(null);

  sleepForm = this.fb.group({ sleep_date: [new Date().toISOString().slice(0,10)], sleep_hours: [null], sleep_quality_score: [null] });
  recForm = this.fb.group({ metric_date: [new Date().toISOString().slice(0,10)], resting_heart_rate_bpm: [null], hrv_ms: [null] });

  ngOnInit() { this.loadMetrics(); }

  loadMetrics() {
    this.api.get<any[]>('/recovery/metrics', { days: 60 }).subscribe(data => {
      if (!data?.length) return;
      const dates = data.map((d: any) => d.metric_date).reverse();
      const rhr = data.map((d: any) => d.resting_heart_rate_bpm).reverse();
      this.hrChart.set({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: '#0d1f3c', textStyle: { color: '#f0f4ff' } },
        xAxis: { type: 'category', data: dates, axisLabel: { color: '#8ba5cc' }, axisLine: { lineStyle: { color: '#1a3050' } } },
        yAxis: { type: 'value', name: 'bpm', axisLabel: { color: '#8ba5cc' }, splitLine: { lineStyle: { color: '#1a3050' } } },
        series: [{ type: 'line', data: rhr, smooth: true, lineStyle: { color: '#e879a0', width: 2 }, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#e879a0' }, areaStyle: { color: 'rgba(232,121,160,0.1)' } }],
      });
    });
  }

  analyzeRecovery() {
    this.analyzing.set(true);
    this.api.get<any>('/recovery/analysis').subscribe({
      next: (r) => { this.analysis.set(r); this.analyzing.set(false); },
      error: () => this.analyzing.set(false),
    });
  }

  logSleep() {
    this.api.post('/recovery/sleep', this.sleepForm.value).subscribe(() => this.sleepForm.reset());
  }

  logRecovery() {
    this.api.post('/recovery/metrics', this.recForm.value).subscribe(() => { this.recForm.reset(); this.loadMetrics(); });
  }

  signalColor(severity: number): string {
    if (severity > 0.7) return 'var(--rs-error)';
    if (severity > 0.4) return 'var(--rs-warning)';
    return 'var(--rs-blue-500)';
  }

  signalIcon(type: string): string {
    const m: Record<string,string> = { pace_decline: 'trending_down', high_training_load: 'warning', hrv_decline: 'favorite_border', resting_hr_elevated: 'monitor_heart' };
    return m[type] || 'info';
  }
}
