import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';

interface ImportResult { id: string; original_filename: string; file_format: string; import_status: string; activities_count: number; error_message?: string; }

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatChipsModule],
  template: `
    <div class="rs-page">
      <h1 class="page-title">Importar Actividad</h1>
      <p class="page-sub">Sube archivos de tu dispositivo o exportación manual</p>

      <!-- Drop Zone -->
      <div class="drop-zone rs-card"
           [class.drop-zone--active]="isDragging()"
           (dragover)="$event.preventDefault(); isDragging.set(true)"
           (dragleave)="isDragging.set(false)"
           (drop)="onDrop($event)">
        <span class="material-icons drop-zone__icon">cloud_upload</span>
        <h3>Arrastra tu archivo aquí</h3>
        <p class="drop-zone__sub">o haz clic para seleccionar</p>
        <div class="drop-zone__formats">
          @for (fmt of formats; track fmt) {
            <span class="rs-badge rs-badge--blue">.{{ fmt }}</span>
          }
        </div>
        <input type="file" #fileInput [accept]="acceptStr" (change)="onFileSelected($event)" class="drop-zone__input" />
        <button class="rs-btn rs-btn--outline" (click)="fileInput.click()">
          <span class="material-icons">attach_file</span> Seleccionar archivo
        </button>
        <p class="drop-zone__limit">Tamaño máximo: 50 MB</p>
      </div>

      <!-- Progress -->
      @if (uploading()) {
        <div class="rs-card import-progress">
          <mat-progress-bar mode="indeterminate" color="primary" />
          <p>Procesando {{ currentFile()?.name }}...</p>
        </div>
      }

      <!-- Results -->
      @for (result of results(); track result.id) {
        <div class="rs-card import-result" [class.import-result--success]="result.import_status === 'success'" [class.import-result--error]="result.import_status === 'failed'" [class.import-result--dup]="result.import_status === 'duplicate'">
          <div class="import-result__header">
            <span class="material-icons">{{ result.import_status === 'success' ? 'check_circle' : result.import_status === 'duplicate' ? 'content_copy' : 'error' }}</span>
            <div>
              <div class="import-result__name">{{ result.original_filename }}</div>
              <div class="import-result__meta">
                <span class="rs-badge" [class.rs-badge--green]="result.import_status==='success'" [class.rs-badge--warn]="result.import_status==='duplicate'" [class.rs-badge--pink]="result.import_status==='failed'">
                  {{ statusLabel(result.import_status) }}
                </span>
                @if (result.activities_count > 0) {
                  <span class="import-result__count">{{ result.activities_count }} actividad(es) importada(s)</span>
                }
              </div>
              @if (result.error_message) {
                <div class="import-result__error">{{ result.error_message }}</div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Instructions -->
      <div class="rs-grid-2 import-instructions">
        @for (fmt of formatInfo; track fmt.name) {
          <div class="rs-card">
            <h4>{{ fmt.name }}</h4>
            <p class="fmt-desc">{{ fmt.desc }}</p>
            <ul class="fmt-list">
              @for (tip of fmt.tips; track tip) { <li>{{ tip }}</li> }
            </ul>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-title { margin-bottom: 4px; }
    .page-sub { color: var(--rs-text-secondary); margin-bottom: 28px; }

    .drop-zone {
      text-align: center; padding: 60px 40px; border: 2px dashed var(--rs-border); cursor: pointer;
      transition: all 0.3s; position: relative; margin-bottom: 20px;
      .drop-zone__icon { font-size: 56px; color: var(--rs-blue-500); margin-bottom: 16px; display: block; opacity: 0.7; }
      h3 { margin-bottom: 8px; }
      .drop-zone__sub { color: var(--rs-text-secondary); margin-bottom: 20px; }
      .drop-zone__formats { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
      .drop-zone__input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
      .drop-zone__limit { font-size: 0.75rem; color: var(--rs-text-muted); margin-top: 12px; }
      &--active { border-color: var(--rs-blue-500); background: rgba(26,108,255,0.05); }
    }

    .import-progress { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; p { color: var(--rs-text-secondary); } }

    .import-result {
      margin-bottom: 12px;
      .import-result__header { display: flex; align-items: flex-start; gap: 16px; }
      .material-icons { font-size: 28px; }
      .import-result__name { font-weight: 600; margin-bottom: 6px; }
      .import-result__meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .import-result__count { font-size: 0.85rem; color: var(--rs-text-secondary); }
      .import-result__error { font-size: 0.8rem; color: var(--rs-error); margin-top: 6px; }

      &--success .material-icons { color: var(--rs-success); }
      &--error .material-icons { color: var(--rs-error); }
      &--dup .material-icons { color: var(--rs-warning); }
    }

    .import-instructions { margin-top: 32px;
      h4 { margin-bottom: 8px; color: var(--rs-blue-300); }
      .fmt-desc { font-size: 0.85rem; color: var(--rs-text-secondary); margin-bottom: 10px; }
      .fmt-list { list-style: none; padding: 0;
        li { font-size: 0.8rem; color: var(--rs-text-muted); padding: 2px 0; &::before { content: '→ '; color: var(--rs-blue-500); } }
      }
    }
  `],
})
export class ImportComponent {
  private api = inject(ApiService);

  formats = ['fit', 'gpx', 'tcx', 'csv'];
  acceptStr = '.fit,.gpx,.tcx,.csv';
  isDragging = signal(false);
  uploading = signal(false);
  currentFile = signal<File | null>(null);
  results = signal<ImportResult[]>([]);

  formatInfo = [
    { name: '.FIT', desc: 'Formato nativo de Garmin y otros dispositivos GPS', tips: ['Exporta directamente desde Garmin Connect', 'Contiene datos completos de sensores', 'Soporta múltiples tipos de actividad'] },
    { name: '.GPX', desc: 'Formato GPS Exchange, ampliamente compatible', tips: ['Compatible con la mayoría de apps', 'Incluye coordenadas GPS y altitud', 'Puede incluir frecuencia cardíaca en extensiones'] },
    { name: '.TCX', desc: 'Training Center XML de Garmin', tips: ['Incluye datos de zonas de FC', 'Exportable desde Garmin Connect', 'Soporta datos de ritmo y potencia'] },
    { name: '.CSV', desc: 'Hoja de cálculo con historial de actividades', tips: ['Encabezados en inglés o español', 'Columnas: date, distance, duration, avg_hr', 'Útil para múltiples actividades a la vez'] },
  ];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.uploadFile(input.files[0]);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.uploadFile(file);
  }

  uploadFile(file: File): void {
    this.currentFile.set(file);
    this.uploading.set(true);
    this.api.uploadFile<ImportResult>('/activities/import', file).subscribe({
      next: (result) => {
        this.results.update(r => [result, ...r]);
        this.uploading.set(false);
      },
      error: (err) => {
        this.results.update(r => [{
          id: Date.now().toString(),
          original_filename: file.name,
          file_format: file.name.split('.').pop() || '',
          import_status: 'failed',
          activities_count: 0,
          error_message: err.error?.detail || 'Error al importar',
        }, ...r]);
        this.uploading.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { success: 'Exitoso', failed: 'Error', duplicate: 'Duplicado', processing: 'Procesando', pending: 'Pendiente' };
    return map[status] || status;
  }
}
