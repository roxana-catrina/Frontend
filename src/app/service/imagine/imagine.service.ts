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

  deleteImage(imageId: number, userId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.delete(`${BASIC_URL}/api/user/${userId}/imagine/${imageId}`, {
      headers: headers
    });
  }
}
