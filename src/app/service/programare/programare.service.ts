import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Programare, ProgramareDTO } from '../../models/programare';

const BASE_URL = 'http://localhost:8083/';

@Injectable({
  providedIn: 'root'
})
export class ProgramareService {

  constructor(private http: HttpClient) { }

  private createAuthorizationHeader(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  // Creează o programare nouă
  createProgramare(programareDTO: ProgramareDTO): Observable<Programare> {
    return this.http.post<Programare>(
      BASE_URL + 'api/programari',
      programareDTO,
      { headers: this.createAuthorizationHeader() }
    );
  }

  // Obține toate programările unui utilizator
  getAllProgramari(userId: number): Observable<Programare[]> {
    return this.http.get<Programare[]>(
      BASE_URL + `api/programari/user/${userId}`,
      { headers: this.createAuthorizationHeader() }
    );
  }

  // Obține programările pentru o anumită lună
  getProgramariByMonth(userId: number, year: number, month: number): Observable<Programare[]> {
    return this.http.get<Programare[]>(
      BASE_URL + `api/programari/user/${userId}/month?year=${year}&month=${month}`,
      { headers: this.createAuthorizationHeader() }
    );
  }

  // Obține programările viitoare
  getProgramariViitoare(userId: number): Observable<Programare[]> {
    return this.http.get<Programare[]>(
      BASE_URL + `api/programari/user/${userId}/upcoming`,
      { headers: this.createAuthorizationHeader() }
    );
  }

  // Actualizează o programare
  updateProgramare(id: number, programareDTO: ProgramareDTO): Observable<Programare> {
    return this.http.put<Programare>(
      BASE_URL + `api/programari/${id}`,
      programareDTO,
      { headers: this.createAuthorizationHeader() }
    );
  }

  // Șterge o programare
  deleteProgramare(id: number): Observable<void> {
    return this.http.delete<void>(
      BASE_URL + `api/programari/${id}`,
      { headers: this.createAuthorizationHeader() }
    );
  }

  // Actualizează statusul unei programări
  updateStatus(id: number, status: string): Observable<Programare> {
    return this.http.patch<Programare>(
      BASE_URL + `api/programari/${id}/status`,
      { status },
      { headers: this.createAuthorizationHeader() }
    );
  }
}
