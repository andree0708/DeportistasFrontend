import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="rs-page">
      <h1>Configuración</h1>
      <div class="rs-grid-2" style="margin-top:24px">
        <div class="rs-card">
          <h3><span class="material-icons" style="vertical-align:middle;margin-right:8px;color:var(--rs-blue-400)">privacy_tip</span>Privacidad y Datos</h3>
          <p style="color:var(--rs-text-secondary);margin:12px 0">Tus datos deportivos son tratados como información personal sensible. Nunca se comparten con terceros sin tu consentimiento.</p>
          <button class="rs-btn rs-btn--outline rs-btn--sm"><span class="material-icons">download</span>Exportar mis datos</button>
        </div>
        <div class="rs-card">
          <h3><span class="material-icons" style="vertical-align:middle;margin-right:8px;color:var(--rs-accent-pink)">device_hub</span>Fuentes de Datos</h3>
          <p style="color:var(--rs-text-secondary);margin:12px 0">Importación manual de archivos .FIT, .GPX, .TCX y .CSV disponible. Integraciones directas con dispositivos: próximamente.</p>
          <button class="rs-btn rs-btn--ghost rs-btn--sm">Ver integraciones disponibles</button>
        </div>
        <div class="rs-card">
          <h3><span class="material-icons" style="vertical-align:middle;margin-right:8px;color:var(--rs-accent-purple)">notifications</span>Notificaciones</h3>
          <p style="color:var(--rs-text-secondary);margin:12px 0">Gestiona las alertas y recomendaciones que recibes del sistema.</p>
        </div>
        <div class="rs-card">
          <h3><span class="material-icons" style="vertical-align:middle;margin-right:8px;color:var(--rs-warning)">info</span>Acerca de RunSense AI</h3>
          <p style="color:var(--rs-text-secondary);margin:12px 0">RunSense AI estima capacidad y rendimiento a partir de datos observados. <strong>No realiza diagnósticos médicos ni sustituye a un profesional del deporte o la salud.</strong></p>
          <span class="rs-badge rs-badge--blue">Versión 1.0.0</span>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {}
