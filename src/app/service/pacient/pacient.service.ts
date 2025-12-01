import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pacient } from '../../models/pacient';

const BASIC_URL = 'http://localhost:8083';

@Injectable({
  providedIn: 'root'
})
export class PacientService {

  constructor(private http: HttpClient) { }

  // Create new patient
  createPacient(userId: string, pacient: Partial<Pacient>): Observable<Pacient> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<Pacient>(`${BASIC_URL}/api/user/${userId}/pacient`, pacient, { headers });
  }

  // Get all patients for a user
  getAllPacienti(userId: string): Observable<Pacient[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Pacient[]>(`${BASIC_URL}/api/user/${userId}/pacienti`, { headers });
  }

  // Get a specific patient by ID
  getPacientById(userId: string, pacientId: string): Observable<Pacient> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Pacient>(`${BASIC_URL}/api/user/${userId}/pacient/${pacientId}`, { headers });
  }

  // Update patient
  updatePacient(userId: string, pacientId: string, pacient: Partial<Pacient>): Observable<Pacient> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<Pacient>(`${BASIC_URL}/api/user/${userId}/pacient/${pacientId}`, pacient, { headers });
  }

  // Delete patient
  deletePacient(userId: string, pacientId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${BASIC_URL}/api/user/${userId}/pacient/${pacientId}`, { headers });
  }

  // Upload image for a patient
  uploadImageForPacient(userId: string, pacientId: string, formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${BASIC_URL}/api/user/${userId}/pacient/${pacientId}/imagine`, formData, { headers });
  }

  // Create patient with image in one request
  createPacientWithImage(userId: string, formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${BASIC_URL}/api/user/${userId}/pacient/withdata`, formData, { headers });
  }
}
