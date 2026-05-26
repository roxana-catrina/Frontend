import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { PredictionResponse } from '../../models/imagine';

export interface PredictionResult {
  success: boolean;
  prediction: string;
  confidence: number;
  hasTumor: boolean;
  error?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BrainTumorService {
  private apiUrl = 'http://localhost:8083/api/brain-tumor';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  predictTumor(file: File): Observable<PredictionResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PredictionResult>(`${this.apiUrl}/predict`, formData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Eroare la conectarea cu serviciul ML:', error);
        return of({
          success: false,
          prediction: '',
          confidence: 0,
          hasTumor: false,
          type: '',
          error: 'Serviciul de analiză ML nu este disponibil. Vă rugăm verificați dacă backend-ul rulează.'
        });
      })
    );
  }

  /**
   * Analizează o imagine folosind URL-ul de pe Cloudinary
   */
  predictFromUrl(imageUrl: string): Observable<PredictionResult> {
    const body = { imageUrl: imageUrl };
    return this.http.post<PredictionResult>(`${this.apiUrl}/predict-from-url`, body, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Eroare la analiza imaginii de pe URL:', error);
        return of({
          success: false,
          prediction: '',
          confidence: 0,
          hasTumor: false,
          type: '',
          error: 'Nu s-a putut analiza imaginea de pe URL. Vă rugăm să încercați din nou.'
        });
      })
    );
  }

  /**
   * Analizează o imagine cu segmentare (heatmap + contur + dimensiuni)
   */
  predictWithSegmentation(file: File, threshold: number = 0.4): Observable<PredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PredictionResponse>(
      `${this.apiUrl}/predict-with-segmentation?threshold=${threshold}`,
      formData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Eroare la analiza cu segmentare:', error);
        return of({
          success: false,
          prediction: '',
          hasTumor: false,
          confidence: 0,
          error: 'Serviciul de segmentare nu este disponibil.'
        } as PredictionResponse);
      })
    );
  }

  /**
   * Analizează o imagine de pe URL cu segmentare
   */
  predictFromUrlWithSegmentation(imageUrl: string, threshold: number = 0.4): Observable<PredictionResponse> {
    const body = { imageUrl, threshold };
    return this.http.post<PredictionResponse>(
      `${this.apiUrl}/predict-from-url-with-segmentation`,
      body,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Eroare la analiza cu segmentare de pe URL:', error);
        return of({
          success: false,
          prediction: '',
          hasTumor: false,
          confidence: 0,
          error: 'Serviciul de segmentare nu este disponibil.'
        } as PredictionResponse);
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
