import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="rs-page">
      <h1>Mi Perfil</h1>
      <p class="page-sub">Completa tu perfil para mejorar las predicciones del modelo</p>

      <div class="profile-grid">
        <div class="rs-card">
          <h3 style="margin-bottom:20px">Datos deportivos</h3>
          <form [formGroup]="form" (ngSubmit)="save()" class="profile-form">
            <mat-form-field appearance="outline"><mat-label>Edad</mat-label><input matInput type="number" formControlName="age" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Peso (kg)</mat-label><input matInput type="number" step="0.1" formControlName="weight_kg" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Altura (cm)</mat-label><input matInput type="number" formControlName="height_cm" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Años corriendo</mat-label><input matInput type="number" formControlName="experience_years" /></mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Nivel de experiencia</mat-label>
              <mat-select formControlName="experience_level">
                <mat-option value="beginner">Principiante</mat-option>
                <mat-option value="intermediate">Intermedio</mat-option>
                <mat-option value="advanced">Avanzado</mat-option>
                <mat-option value="elite">Élite</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Objetivo principal</mat-label>
              <mat-select formControlName="primary_goal">
                <mat-option value="Terminar mi primera carrera">Terminar mi primera carrera</mat-option>
                <mat-option value="Mejorar mi tiempo en 5K">Mejorar tiempo en 5K</mat-option>
                <mat-option value="Correr 10K">Correr 10K</mat-option>
                <mat-option value="Terminar media maratón">Terminar media maratón</mat-option>
                <mat-option value="Mejorar rendimiento general">Mejorar rendimiento general</mat-option>
                <mat-option value="Mantenerme activa">Mantenerme activa</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Días de entrenamiento / semana</mat-label><input matInput type="number" min="1" max="7" formControlName="training_days_per_week" /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><mat-label>Sobre mí (opcional)</mat-label><textarea matInput rows="3" formControlName="bio"></textarea></mat-form-field>
            <div class="profile-actions">
              <button mat-raised-button class="rs-btn rs-btn--primary" type="submit">
                <span class="material-icons">save</span> {{ isNew() ? 'Crear perfil' : 'Guardar cambios' }}
              </button>
            </div>
          </form>
        </div>

        <div class="profile-side">
          <div class="rs-card rs-card--accent profile-avatar-card">
            <div class="profile-avatar">{{ initial() }}</div>
            <div class="profile-level rs-badge rs-badge--blue">{{ form.value.experience_level || 'Corredora' }}</div>
            <div class="profile-goal">{{ form.value.primary_goal || 'Sin objetivo definido' }}</div>
          </div>

          @if (!isNew()) {
            <div class="rs-card">
              <h4 style="margin-bottom:12px">Dispositivos registrados</h4>
              <button class="rs-btn rs-btn--outline rs-btn--sm" (click)="addDevice()">
                <span class="material-icons">watch</span> Agregar dispositivo
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-sub { color: var(--rs-text-secondary); margin-bottom: 28px; }
    .profile-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; @media(max-width:900px){ grid-template-columns:1fr; } }
    .profile-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; @media(max-width:600px){ grid-template-columns:1fr; } .full { grid-column: span 2; @media(max-width:600px){ grid-column:span 1; } } }
    .profile-actions { grid-column: span 2; @media(max-width:600px){ grid-column:span 1; } }
    .profile-side { display: flex; flex-direction: column; gap: 16px; }
    .profile-avatar-card { text-align: center; padding: 32px; }
    .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--rs-gradient-accent); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; color: white; margin: 0 auto 16px; box-shadow: 0 8px 24px rgba(26,108,255,0.4); }
    .profile-level { margin-bottom: 8px; }
    .profile-goal { font-size: 0.875rem; color: var(--rs-text-secondary); }
  `],
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  isNew = signal(true);

  form = this.fb.group({
    age: [null], weight_kg: [null], height_cm: [null],
    experience_years: [0], experience_level: ['beginner'],
    primary_goal: [''], training_days_per_week: [null],
    bio: [''],
  });

  ngOnInit() {
    this.api.get<any>('/runner/profile').subscribe({
      next: (p) => { this.isNew.set(false); this.form.patchValue(p); },
      error: () => this.isNew.set(true),
    });
  }

  save() {
    const req = this.isNew()
      ? this.api.post('/runner/profile', this.form.value)
      : this.api.put('/runner/profile', this.form.value);
    req.subscribe({
      next: () => { this.isNew.set(false); this.snack.open('Perfil guardado', 'Cerrar', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.detail || 'Error al guardar', 'Cerrar', { duration: 4000 }),
    });
  }

  addDevice() { this.snack.open('Próximamente: gestión de dispositivos', 'Cerrar', { duration: 3000 }); }
  initial(): string { return 'R'; }
}
