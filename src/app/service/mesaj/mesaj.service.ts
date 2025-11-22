import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mesaj, MesajRequest } from '../../models/mesaj';

const BASIC_URL = 'http://localhost:8083';

@Injectable({
  providedIn: 'root'
})
export class MesajService {

  constructor(private http: HttpClient) { }

  // Trimite un mesaj
  trimiteMesaj(mesajRequest: MesajRequest): Observable<Mesaj> {
    return this.http.post<Mesaj>(`${BASIC_URL}/api/mesaje/trimite`, mesajRequest);
  }

  // Obține conversația între doi utilizatori
  getConversation(user1Id: number, user2Id: number): Observable<Mesaj[]> {
    return this.http.get<Mesaj[]>(`${BASIC_URL}/api/mesaje/conversatie/${user1Id}/${user2Id}`);
  }

  // Marchează mesajele ca citite
  marcheazaCaCitite(userId: number, expeditorId: number): Observable<void> {
    return this.http.put<void>(`${BASIC_URL}/api/mesaje/citeste/${userId}/${expeditorId}`, {});
  }

  // Numără mesajele necitite
  countUnreadMessages(userId: number): Observable<number> {
    return this.http.get<number>(`${BASIC_URL}/api/mesaje/necitite/${userId}`);
  }

  // Obține conversațiile recente
  getRecentConversations(userId: number): Observable<Mesaj[]> {
    return this.http.get<Mesaj[]>(`${BASIC_URL}/api/mesaje/recente/${userId}`);
  }
}
