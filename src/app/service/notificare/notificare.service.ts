import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notificare } from '../../models/mesaj';

const BASIC_URL = 'http://localhost:8083';

@Injectable({
  providedIn: 'root'
})
export class NotificareService {

  constructor(private http: HttpClient) { }

  // Obține toate notificările pentru un utilizator
  getNotificari(userId: number): Observable<Notificare[]> {
    return this.http.get<Notificare[]>(`${BASIC_URL}/api/notificari/user/${userId}`);
  }

  // Obține notificările necitite
  getNotificariNecitite(userId: number): Observable<Notificare[]> {
    return this.http.get<Notificare[]>(`${BASIC_URL}/api/notificari/user/${userId}/necitite`);
  }

  // Numără notificările necitite
  countNotificariNecitite(userId: number): Observable<number> {
    return this.http.get<number>(`${BASIC_URL}/api/notificari/user/${userId}/count`);
  }

  // Marchează o notificare ca citită
  marcheazaCaCitita(notificareId: number): Observable<void> {
    return this.http.put<void>(`${BASIC_URL}/api/notificari/${notificareId}/citeste`, {});
  }

  // Marchează toate notificările ca citite
  marcheazaToateCaCitite(userId: number): Observable<void> {
    return this.http.put<void>(`${BASIC_URL}/api/notificari/user/${userId}/citeste-toate`, {});
  }

  // Șterge o notificare
  stergeNotificare(notificareId: number): Observable<void> {
    return this.http.delete<void>(`${BASIC_URL}/api/notificari/${notificareId}`);
  }

  // Șterge toate notificările
  stergeToateNotificarile(userId: number): Observable<void> {
    return this.http.delete<void>(`${BASIC_URL}/api/notificari/user/${userId}`);
  }
}
