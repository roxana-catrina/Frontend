import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
interface Country {
 nume: string;
  cod: string;
}

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private apiUrl='http://localhost:8083/api/countries';

  constructor(private http: HttpClient) { 
    
  }
getCountries():Observable<Country[]>{
  return this.http.get<Country[]>(this.apiUrl);
}
}