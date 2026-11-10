import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-predictions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatCardModule],
  template: `
    <div class="rs-page">
      <h1>Predicción de Rendimiento</h1>
      <p class="page-sub">El modelo de IA analiza tu historial para estimar tiempos y ritmos</p>

      <div class="pred-grid">
        <!-- Form -->
        <div class="rs-card">
          <h3 style="margin-bottom:20px">Nueva predicción</h3>
          <form [formGroup]="form" (ngSubmit)="predict()" class="pred-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Distancia objetivo</mat-label>
              <mat-select formControlName="target_distance_km">
                @for (d of distances; track d.value) {
                  <mat-option [value]="d.value">{{ d.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <button mat-raised-button class="rs-btn rs-btn--primary" type="submit" [disabled]="loading() || form.invalid" style="width:100%">
              @if (loading()) { <mat-spinner diameter="20" /> }
              @else { <span class="material-icons">insights</span> Generar predicción }
            </button>
          </form>

          @if (errorMsg()) {
            <div class="pred-error"><span class="material-icons">warning</span>{{ errorMsg() }}</div>
          }
        </div>

        <!-- Latest result -->
        @if (latestPred()) {
          <div class="rs-card rs-card--accent pred-result">
            <div class="pred-result__header">
              <span class="rs-badge rs-badge--purple">IA gRPC</span>
              @if (latestPred().is_extrapolation) { <span class="rs-badge rs-badge--warn">Extrapolación</span> }
            </div>
            <div class="pred-result__dist">{{ latestPred().target_distance_km }} km</div>
            <div class="pred-result__time">{{ formatTime(latestPred().predicted_time_seconds) }}</div>
            <div class="pred-result__pace">{{ formatPace(latestPred().predicted_pace_sec_per_km) }} / km</div>

            @if (latestPred().uncertainty) {
              <div class="pred-uncertainty">
                Intervalo {{ (latestPred().uncertainty.confidence_level*100)|number:'1.0-0' }}%:
                {{ formatTime(latestPred().uncertainty.lower_bound_seconds) }} —
                {{ formatTime(latestPred().uncertainty.upper_bound_seconds) }}
              </div>
            }

            @if (latestPred().top_factors?.length) {
              <div class="pred-factors">
                <h4>Factores principales</h4>
                @for (f of latestPred().top_factors; track f.feature_name) {
                  <div class="pred-factor">
                    <span>{{ f.description }}</span>
                    <div class="pred-factor__bar" [style.width.%]="f.importance*100"></div>
                  </div>
                }
              </div>
            }

            @for (w of latestPred().warnings; track w) {
              <div class="pred-warning"><span class="material-icons">info</span>{{ w }}</div>
            }

            <div class="pred-disclaimer">⚠ Esta es una estimación basada en tus datos históricos. No es una garantía de resultado.</div>
          </div>
        }
      </div>

      <!-- History -->
      @if (history().length) {
        <div class="rs-card pred-history">
          <h3 style="margin-bottom:16px">Historial de predicciones</h3>
          <div class="pred-hist-list">
            @for (p of history(); track p.id) {
              <div class="pred-hist-item">
                <div class="pred-hist-dist">{{ p.target_distance_km }} km</div>
                <div class="pred-hist-time">{{ formatTime(p.predicted_time_seconds) }}</div>
                <div class="pred-hist-pace">{{ formatPace(p.predicted_pace_sec_per_km) }}/km</div>
                <div class="pred-hist-date">{{ p.generated_at | date:'d MMM yyyy' }}</div>
                <span class="rs-badge" [class.rs-badge--green]="p.status==='completed'" [class.rs-badge--pink]="p.status==='failed'">{{ p.status }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-sub { color: var(--rs-text-secondary); margin-bottom: 28px; }
    .pred-grid { display: grid; grid-template-columns: 380px 1fr; gap: 20px; margin-bottom: 20px; @media(max-width:800px){ grid-template-columns:1fr; } }
    .pred-form { display: flex; flex-direction: column; gap: 16px; }
    .full-width { width: 100%; }
    .pred-error { display: flex; align-items: center; gap: 8px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: var(--rs-error); padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 0.875rem; }
    .pred-result { text-align: center; padding: 32px; }
    .pred-result__header { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
    .pred-result__dist { font-size: 1rem; color: var(--rs-text-secondary); }
    .pred-result__time { font-size: 3rem; font-weight: 700; background: var(--rs-gradient-accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 8px 0; }
    .pred-result__pace { font-size: 1.2rem; color: var(--rs-blue-300); font-weight: 600; }
    .pred-uncertainty { font-size: 0.85rem; color: var(--rs-text-secondary); margin-top: 12px; }
    .pred-factors { text-align: left; margin-top: 24px; h4 { margin-bottom: 12px; font-size: 0.9rem; color: var(--rs-text-secondary); } }
    .pred-factor { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; span { font-size: 0.8rem; color: var(--rs-text-muted); } }
    .pred-factor__bar { height: 4px; background: var(--rs-gradient-accent); border-radius: 2px; transition: width 0.6s ease; }
    .pred-warning { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--rs-warning); margin-top: 8px; .material-icons { font-size: 16px; } }
    .pred-disclaimer { font-size: 0.75rem; color: var(--rs-text-muted); margin-top: 16px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .pred-hist-list { display: flex; flex-direction: column; gap: 8px; }
    .pred-hist-item { display: flex; align-items: center; gap: 20px; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.03); flex-wrap: wrap; }
    .pred-hist-dist { font-weight: 700; color: var(--rs-blue-300); min-width: 60px; }
    .pred-hist-time { font-weight: 600; }
    .pred-hist-pace { color: var(--rs-text-secondary); font-size: 0.875rem; }
    .pred-hist-date { color: var(--rs-text-muted); font-size: 0.8rem; flex: 1; }
  `],
})
export class PredictionsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  loading = signal(false);
  errorMsg = signal('');
  latestPred = signal<any>(null);
  history = signal<any[]>([]);

  distances = [
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 15, label: '15 km' },
    { value: 21.1, label: 'Media maratón (21.1 km)' },
  ];

  form = this.fb.group({ target_distance_km: [10, Validators.required] });

  ngOnInit() {
    this.api.get<any[]>('/predictions/history').subscribe(h => this.history.set(h));
  }

  predict() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');
    this.api.post<any>('/predictions/performance', this.form.value).subscribe({
      next: (r) => { this.latestPred.set(r); this.history.update(h => [r, ...h]); this.loading.set(false); },
      error: (e) => { this.errorMsg.set(e.error?.detail || 'Error al generar la predicción'); this.loading.set(false); },
    });
  }

  formatTime(s?: number): string { if(!s) return '--:--:--'; const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.round(s%60); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
  formatPace(s?: number): string { if(!s) return '--:--'; return `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`; }
}
