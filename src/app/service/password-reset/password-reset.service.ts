import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
const BASE_URL = 'http://localhost:8083';
@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {

  constructor(private http: HttpClient) { }

  // Trimite codul de verificare pe email
  sendVerificationCode(email: string): Observable<any> {
    const url = BASE_URL + '/api/password-reset/send-code';
    const body = { email };
    console.log('🌐 Service: Trimit request la:', url);
    console.log('🌐 Service: Body:', body);
    return this.http.post(url, body);
  }

  // Verifică codul și resetează parola
  resetPasswordWithCode(email: string, code: string, newPassword: string): Observable<any> {
    return this.http.post( BASE_URL +'/api/password-reset/verify-and-reset', {
      email,
      code,
      newPassword
    });
  }
}
