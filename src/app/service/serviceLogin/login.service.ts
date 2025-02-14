import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../models/user';


@Injectable({
  providedIn: 'root' // Serviciul este disponibil în întreaga aplicație
})
export class LoginService {
;

  constructor(private http: HttpClient) { }

  // Metodă pentru autentificare
  login(credentials: { email: string; parola: string }) {
    return this.http.post('/authenticate', credentials, { withCredentials: true });
  }
 // login(credentials: { email: string; parola: string }) {
  //  return this.http.post<{ message: string }>("/authenticate", credentials, { 
   //     withCredentials: true 
   // });



   /* login(email: string, parola: string): Observable<User> {
      return this.http.post<User>(
        '/authenticate', // Schimbă portul la cel corect al backend-ului
        { email, parola }
      );
    }*/
    
    
}

