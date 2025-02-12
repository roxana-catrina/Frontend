import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
  
const BASIC_URL = 'http://localhost:8083';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private hhtp:HttpClient) { }

  login(loginRequest:any):Observable<any>{
    return this.hhtp.post(BASIC_URL+"/api/authenticate",loginRequest);
  }
}
