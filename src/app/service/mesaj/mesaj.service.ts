import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mesaj, MesajRequest } from '../../models/mesaj';

const BASIC_URL = 'http://localhost:8083';

@Injectable({
  providedIn: 'root'
})
export class MesajService {

  constructor(private http: HttpClient) { }

  private createAuthorizationHeader(): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('🔐 MesajService - Token din localStorage:', token ? 'EXISTS' : 'NULL');
    if (token) {
      console.log('   Token preview:', token.substring(0, 20) + '...');
    }
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  // Trimite un mesaj
  trimiteMesaj(mesajRequest: MesajRequest): Observable<Mesaj> {
    const headers = this.createAuthorizationHeader();
    console.log('📤 POST /api/mesaje/trimite');
    console.log('   Request body:', JSON.stringify(mesajRequest, null, 2));
    console.log('   Headers:', headers);
    return this.http.post<Mesaj>(`${BASIC_URL}/api/mesaje/trimite`, mesajRequest, { headers });
  }

  // Obține conversația între doi utilizatori
  getConversation(user1Id: string, user2Id: string): Observable<Mesaj[]> {
    return this.http.get<Mesaj[]>(`${BASIC_URL}/api/mesaje/conversatie/${user1Id}/${user2Id}`, 
      { headers: this.createAuthorizationHeader() });
  }

  // Marchează mesajele ca citite
  marcheazaCaCitite(userId: string, expeditorId: string): Observable<void> {
    return this.http.put<void>(`${BASIC_URL}/api/mesaje/citeste/${userId}/${expeditorId}`, {}, 
      { headers: this.createAuthorizationHeader() });
  }

  // Numără mesajele necitite
  countUnreadMessages(userId: string): Observable<number> {
    return this.http.get<number>(`${BASIC_URL}/api/mesaje/necitite/${userId}`, 
      { headers: this.createAuthorizationHeader() });
  }

  // Obține conversațiile recente
  getRecentConversations(userId: string): Observable<Mesaj[]> {
    return this.http.get<Mesaj[]>(`${BASIC_URL}/api/mesaje/recente/${userId}`, 
      { headers: this.createAuthorizationHeader() });
  }
}
