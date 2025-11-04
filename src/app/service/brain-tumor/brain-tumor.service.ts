import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface PredictionResult {
  success: boolean;
  prediction: string;
  confidence: number;
  hasTumor: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BrainTumorService {
  // Schimbați portul dacă backend-ul dvs. rulează pe alt port
  private apiUrl = 'http://localhost:8083/api/brain-tumor';

  constructor(private http: HttpClient) { }

  predictTumor(file: File): Observable<PredictionResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PredictionResult>(`${this.apiUrl}/predict`, formData).pipe(
      catchError(error => {
        console.error('Eroare la conectarea cu serviciul ML:', error);
        return of({
          success: false,
          prediction: '',
          confidence: 0,
          hasTumor: false,
          error: 'Serviciul de analiză ML nu este disponibil. Vă rugăm verificați dacă backend-ul rulează.'
        });
      })
    );
  }

  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`).pipe(
      catchError(error => {
        return of({ healthy: false, message: 'Service unavailable' });
      })
    );
  }
}
