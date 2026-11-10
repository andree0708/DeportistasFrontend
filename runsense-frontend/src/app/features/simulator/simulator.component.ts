import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="rs-page">
      <h1>Simulador de Escenarios</h1>
      <p class="page-sub">Explora escenarios hipotéticos y sus estimaciones de rendimiento</p>

      <div class="sim-layout">
        <div class="rs-card sim-form-card">
          <h3 style="margin-bottom:20px">Configurar escenario</h3>
          <form [formGroup]="form" (ngSubmit)="simulate()" class="sim-form">
            <mat-form-field appearance="outline" class="full">
              <mat-label>Nombre del escenario (opcional)</mat-label>
              <input matInput formControlName="name" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Distancia objetivo (km)</mat-label>
              <mat-select formControlName="target_distance_km">
                @for (d of distances; track d.value) { <mat-option [value]="d.value">{{ d.label }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Ritmo objetivo (min:ss/km, opcional)</mat-label>
              <input matInput formControlName="target_pace_input" placeholder="Ej: 5:30" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Sesiones por semana (opcional)</mat-label>
              <input matInput type="number" formControlName="training_frequency_per_week" min="1" max="14" />
            </mat-form-field>
            <button mat-raised-button class="rs-btn rs-btn--primary full" type="submit" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { <span class="material-icons">science</span> Simular }
            </button>
          </form>

          @if (errorMsg()) {
            <div class="sim-error"><span class="material-icons">warning</span>{{ errorMsg() }}</div>
          }
        </div>

        <!-- Results -->
        <div class="sim-results">
          @if (scenarios().length) {
            <h3 style="margin-bottom:16px">Resultados</h3>
            @for (s of scenarios(); track s.id) {
              <div class="rs-card rs-card--accent sim-result">
                <div class="sim-result__header">
                  <span class="sim-result__name">{{ s.name || 'Escenario ' + s.id.slice(0,6) }}</span>
                  <span class="rs-badge rs-badge--blue">{{ s.scenario_config.target_distance_km }} km</span>
                </div>
                @if (s.result?.predicted_time_seconds) {
                  <div class="sim-result__time">{{ formatTime(s.result.predicted_time_seconds) }}</div>
                  <div class="sim-result__pace">{{ formatPace(s.result.predicted_pace_sec_per_km) }} / km</div>
                  @if (s.result?.is_extrapolation) { <span class="rs-badge rs-badge--warn" style="margin-top:8px">Extrapolación — fuera del historial observado</span> }
                  @for (w of s.warnings; track w) { <div class="sim-warning">ℹ {{ w }}</div> }
                }
                <div class="sim-result__date">{{ s.created_at | date:'d MMM yyyy HH:mm' }}</div>
              </div>
            }
          } @else {
            <div class="sim-placeholder">
              <span class="material-icons">science</span>
              <p>Configura un escenario para ver la estimación</p>
              <small>El modelo usará tu historial real de entrenamientos</small>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-sub { color: var(--rs-text-secondary); margin-bottom: 28px; }
    .sim-layout { display: grid; grid-template-columns: 400px 1fr; gap: 20px; @media(max-width:800px){ grid-template-columns:1fr; } }
    .sim-form { display: flex; flex-direction: column; gap: 12px; }
    .full { width: 100%; }
    .sim-error { display: flex; align-items: center; gap: 8px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: var(--rs-error); padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 0.875rem; }
    .sim-results { display: flex; flex-direction: column; gap: 16px; }
    .sim-result__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .sim-result__name { font-weight: 600; }
    .sim-result__time { font-size: 2.5rem; font-weight: 700; background: var(--rs-gradient-accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .sim-result__pace { font-size: 1.1rem; color: var(--rs-blue-300); }
    .sim-result__date { font-size: 0.75rem; color: var(--rs-text-muted); margin-top: 12px; }
    .sim-warning { font-size: 0.8rem; color: var(--rs-warning); margin-top: 6px; }
    .sim-placeholder { text-align: center; padding: 60px; color: var(--rs-text-muted); .material-icons { font-size: 56px; display: block; margin-bottom: 16px; opacity: 0.3; } small { font-size: 0.8rem; }
    }
  `],
})
export class SimulatorComponent {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  loading = signal(false);
  errorMsg = signal('');
  scenarios = signal<any[]>([]);
  distances = [{ value: 5, label: '5 km' }, { value: 10, label: '10 km' }, { value: 15, label: '15 km' }, { value: 21.1, label: 'Media maratón' }];
  form = this.fb.group({ name: [''], target_distance_km: [10, Validators.required], target_pace_input: [''], training_frequency_per_week: [null] });

  simulate() {
    if (this.form.invalid) return;
    this.loading.set(true); this.errorMsg.set('');
    const v = this.form.value;
    const payload: any = { name: v.name, target_distance_km: v.target_distance_km, training_frequency_per_week: v.training_frequency_per_week };
    if (v.target_pace_input) {
      const parts = v.target_pace_input.split(':');
      if (parts.length === 2) payload.target_pace_sec_per_km = parseInt(parts[0])*60 + parseInt(parts[1]);
    }
    this.api.post<any>('/predictions/simulate', payload).subscribe({
      next: (r) => { this.scenarios.update(s => [r, ...s]); this.loading.set(false); },
      error: (e) => { this.errorMsg.set(e.error?.detail || 'Error al simular'); this.loading.set(false); },
    });
  }

  formatTime(s?: number): string { if(!s) return '--:--:--'; const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.round(s%60); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
  formatPace(s?: number): string { if(!s) return '--:--'; return `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`; }
}
