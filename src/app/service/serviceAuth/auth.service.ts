import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface LoginResponse {
  id: string;
  jwt: string;
}

@Injectable({
  providedIn: 'root'
})


  export class AuthService {
    constructor(private http: HttpClient) { }
  
    login(credentials: any): Observable<LoginResponse> {
      return this.http.post<LoginResponse>('/authenticate', credentials);
    }
  }
 

