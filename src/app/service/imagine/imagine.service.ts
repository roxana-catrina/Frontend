import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Imagine } from '../../models/imagine';
import { Observable } from 'rxjs';

const BASIC_URL = 'http://localhost:8083';

@Injectable({
  providedIn: 'root'
})
export class ImagineService {
  constructor(private http: HttpClient) { }

  // Get all images for a patient
  getImagesByPacient(userId: string, pacientId: string): Observable<Imagine[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Imagine[]>(`${BASIC_URL}/api/user/${userId}/pacient/${pacientId}/imagini`, { headers });
  }

  // Get a specific image
  getImageById(userId: string, pacientId: string, imageId: string): Observable<Imagine> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Imagine>(`${BASIC_URL}/api/user/${userId}/pacient/${pacientId}/imagine/${imageId}`, { headers });
  }

  // Delete image
  deleteImage(imageId: string, userId: string, pacientId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.delete(`${BASIC_URL}/api/user/${userId}/pacient/${pacientId}/imagine/${imageId}`, {
      headers: headers
    });
  }

  // Upload image for a patient
  uploadImage(userId: string, pacientId: string, formData: FormData): Observable<Imagine> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<Imagine>(`${BASIC_URL}/api/user/${userId}/pacient/${pacientId}/imagine`, formData, { headers });
  }
}
