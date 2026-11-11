import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="rs-page">
      <div class="page-header">
        <div>
          <h1>Recomendaciones</h1>
          <p class="page-sub">Generadas por IA a partir de tu historial personal</p>
        </div>
        <button class="rs-btn rs-btn--primary" (click)="generate()" [disabled]="generating()">
          @if (generating()) { <mat-spinner diameter="20" /> }
          @else { <span class="material-icons">auto_awesome</span> Generar nuevas }
        </button>
      </div>

      <div class="rs-card narrative-box">
        <div class="narrative-box__head">
          <span class="material-icons">psychology</span>
          <h3>Análisis con IA (LLM)</h3>
        </div>
        <p class="narrative-box__desc">Genera un informe en lenguaje natural con tus datos reales: volumen, predicciones, anomalías y recuperación.</p>
        <div class="narrative-kinds">
          @for (k of kinds; track k.value) {
            <button class="rs-btn rs-btn--sm" [class.rs-btn--primary]="narrKind()===k.value" [class.rs-btn--ghost]="narrKind()!==k.value" (click)="narrKind.set(k.value)">{{ k.label }}</button>
          }
          <button class="rs-btn rs-btn--primary rs-btn--sm" (click)="narrate()" [disabled]="narrating()">
            @if (narrating()) { <mat-spinner diameter="16" /> }
            @else { <span class="material-icons">bolt</span> Analizar }
          </button>
        </div>
        @if (narrError()) {
          <div class="rec-error"><span class="material-icons">warning</span>{{ narrError() }}</div>
        }
        @if (narrating()) {
          <div class="center-spinner"><mat-spinner diameter="32"/></div>
        }
        @if (narrative()) {
          <div class="narrative-result">
            <div class="narrative-result__meta">Modelo {{ narrModel() }} · {{ narrTokens() }} tokens</div>
            <div class="narrative-result__text">{{ narrative() }}</div>
          </div>
        }
      </div>

      @if (errorMsg()) {
        <div class="rec-error"><span class="material-icons">warning</span>{{ errorMsg() }}</div>
      }

      @if (loading()) {
        <div class="center-spinner"><mat-spinner diameter="40"/></div>
      } @else {
        <div class="recs-list">
          @for (rec of recommendations(); track rec.id) {
            <div class="rs-card rec-card" [class.rec-card--unread]="!rec.is_read" [class.rec-card--high]="rec.priority==='high'" [class.rec-card--medium]="rec.priority==='medium'">
              <div class="rec-card__header">
                <span class="rs-badge" [class.rs-badge--pink]="rec.priority==='high'" [class.rs-badge--blue]="rec.priority==='medium'" [class.rs-badge--purple]="rec.priority==='low'">
                  {{ priorityLabel(rec.priority) }}
                </span>
                <span class="rs-badge rs-badge--purple">{{ typeLabel(rec.type) }}</span>
                <span class="rec-date">{{ rec.generated_at | date:'d MMM yyyy' }}</span>
                @if (!rec.is_read) {
                  <span class="rec-new">NUEVA</span>
                }
              </div>
              <h3 class="rec-title">{{ rec.title }}</h3>
              <p class="rec-explanation">{{ rec.explanation }}</p>
              @if (rec.supporting_data?.length) {
                <div class="rec-data">
                  @for (d of rec.supporting_data; track d) {
                    <span class="rs-chip">📊 {{ d }}</span>
                  }
                </div>
              }
              @if (!rec.is_read) {
                <button class="rs-btn rs-btn--ghost rs-btn--sm" (click)="markRead(rec)">Marcar como leída</button>
              }
            </div>
          } @empty {
            <div class="rs-card empty-state">
              <span class="material-icons">lightbulb</span>
              <h3>Sin recomendaciones aún</h3>
              <p>Importa actividades y genera recomendaciones personalizadas con IA</p>
              <button class="rs-btn rs-btn--primary" (click)="generate()">Generar ahora</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .page-sub { color: var(--rs-text-secondary); }
    .center-spinner { display: flex; justify-content: center; padding: 60px; }
    .rec-error { display: flex; align-items: center; gap: 8px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: var(--rs-error); padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .recs-list { display: flex; flex-direction: column; gap: 16px; }
    .rec-card { transition: transform 0.2s; &--high { border-left: 4px solid var(--rs-accent-pink); } &--medium { border-left: 4px solid var(--rs-blue-500); } &--unread { background: rgba(26,108,255,0.08); } }
    .rec-card__header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .rec-date { font-size: 0.75rem; color: var(--rs-text-muted); margin-left: auto; }
    .rec-new { background: var(--rs-accent-pink); color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; letter-spacing: 1px; }
    .rec-title { font-size: 1.05rem; margin-bottom: 10px; }
    .rec-explanation { font-size: 0.875rem; color: var(--rs-text-secondary); margin-bottom: 14px; line-height: 1.6; }
    .rec-data { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .empty-state { text-align: center; padding: 60px; .material-icons { font-size: 56px; color: var(--rs-blue-500); display: block; margin-bottom: 16px; opacity: 0.5; } h3 { margin-bottom: 8px; } p { color: var(--rs-text-secondary); margin-bottom: 20px; } }
    .narrative-box { margin-bottom: 20px; }
    .narrative-box__head { display: flex; align-items: center; gap: 8px; .material-icons { color: var(--rs-accent-purple); } h3 { margin: 0; font-size: 1.05rem; } }
    .narrative-box__desc { font-size: 0.85rem; color: var(--rs-text-secondary); margin: 8px 0 12px; }
    .narrative-kinds { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .narrative-result { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
    .narrative-result__meta { font-size: 0.72rem; color: var(--rs-text-muted); margin-bottom: 8px; }
    .narrative-result__text { font-size: 0.875rem; line-height: 1.7; white-space: pre-wrap; color: var(--rs-text-primary); }
  `],
})
export class RecommendationsComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(false);
  generating = signal(false);
  errorMsg = signal('');
  recommendations = signal<any[]>([]);

  kinds = [
    { value: 'weekly_report', label: 'Semanal' },
    { value: 'prediction_explainer', label: 'Predicciones' },
    { value: 'recovery_brief', label: 'Recuperación' },
  ];
  narrKind = signal('weekly_report');
  narrating = signal(false);
  narrError = signal('');
  narrative = signal('');
  narrModel = signal('');
  narrTokens = signal(0);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<any[]>('/recommendations').subscribe({ next: r => { this.recommendations.set(r); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  generate() {
    this.generating.set(true);
    this.errorMsg.set('');
    this.api.post<any>('/recommendations/generate', {}).subscribe({
      next: () => { this.load(); this.generating.set(false); },
      error: (e) => { this.errorMsg.set(e.error?.detail || 'Error al generar recomendaciones'); this.generating.set(false); },
    });
  }

  markRead(rec: any) {
    this.api.patch(`/recommendations/${rec.id}/read`, {}).subscribe(() => rec.is_read = true);
  }

  narrate() {
    this.narrating.set(true);
    this.narrError.set('');
    this.narrative.set('');
    this.api.post<any>('/recommendations/narrative', { kind: this.narrKind(), focus: '' }).subscribe({
      next: (r) => {
        if (r?.success && r.narrative_markdown) {
          this.narrative.set(r.narrative_markdown);
          this.narrModel.set(r.model || '');
          this.narrTokens.set((r.prompt_tokens || 0) + (r.completion_tokens || 0));
        } else {
          this.narrError.set(r?.error || (r?.warnings || []).join(' ') || 'El LLM no devolvió análisis. Revisa GROQ_API_KEY en el servidor.');
        }
        this.narrating.set(false);
      },
      error: (e) => { this.narrError.set(e.error?.detail || 'Error al generar el análisis'); this.narrating.set(false); },
    });
  }

  priorityLabel(p: string): string { return { high: '🔴 Alta', medium: '🟡 Media', low: '🟢 Baja' }[p] || p; }
  typeLabel(t: string): string { const m: Record<string,string> = { LOAD_ADJUSTMENT:'Carga', RECOVERY:'Recuperación', PACE_REVIEW:'Ritmo', PATTERN_CHANGE:'Patrón', GENERAL:'General' }; return m[t] || t; }
}
