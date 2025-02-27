import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateUserComponent } from '../../components/update-user/update-user.component';

const BASIC_URL = 'http://localhost:8083';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http:HttpClient) { }
  postUser(user:any):Observable<any>{
    return this.http.post(BASIC_URL+"/api/user",user);
  }

  getAllUsers():Observable<any>{
    return this.http.get(BASIC_URL+"/api/users")
   
  }
  getUserById(id:number):Observable<any>{
    return this.http.get(BASIC_URL+"/api/user/"+id); // din java
      }

   updateUser(id:number,user:any):Observable<any>{
    return this.http.put(BASIC_URL+"/api/user/"+id,user); // din java
      }

      deleteUser(id:number):Observable<any>{
        return this.http.delete(BASIC_URL+"/api/user/"+id); // din java
          }  
          
          
}
