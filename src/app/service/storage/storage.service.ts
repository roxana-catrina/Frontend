import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
const TOKEN = "token";
const USER = "user";
const NUME= "nume";
const ID="id"
@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(
    private router: Router
  ) { }

  static saveToken(token: string): void {
    window.localStorage.removeItem(TOKEN);
    window.localStorage.setItem(TOKEN, token);
  }
  static saveUser(user: any): void {
    window.localStorage.removeItem(USER);
    window.localStorage.setItem(USER, JSON.stringify(user));
    window.localStorage.setItem(NUME,user.nume);
    window.localStorage.setItem(ID,user.id);
  }
  static getToken() {
    return window.localStorage.getItem(TOKEN);
  }
  static getUser() {
    const user = localStorage.getItem(USER);
    return user ? JSON.parse(user) : null;

  }
  static isUserLoggedIn(): boolean {
    if (this.getToken()) {
      return true;
    }
    return false;
  }

  static logout(): void {
    if(this.isUserLoggedIn()){
    localStorage.removeItem(USER); // Ștergem datele de autentificare
    localStorage.removeItem(TOKEN);}

  }

}
