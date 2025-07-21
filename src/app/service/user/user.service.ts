import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Imagine } from '../../models/imagine';
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

         /* uploadImage(userId: number, file: File) {
            const formData = new FormData();
            formData.append('file', file);
          //  formData.append('userId',userId.toString);
            return this.http.post(BASIC_URL+"/api/user/"+userId+"/imagine", formData);
          }*/

        uploadImage(userId: number, formData: FormData): Observable<any> {
  const url = BASIC_URL + "/api/user/" + userId + "/imagine";
  console.log("Upload URL:", url);
  return this.http.post(url, formData);
}


/*uploadImage(userId: number, formData: FormData): Observable<any> {
  const token = localStorage.getItem('token'); // sau din alt storage, dacă salvezi altfel

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.post(
    `${BASIC_URL}/api/user/${userId}/imagine`,
    formData,
    { headers }
  );
}*/

        
        
          getUserImages(userId: number) {
            const token = localStorage.getItem('token');  // presupunând că token-ul este salvat în localStorage
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
            return this.http.get(BASIC_URL+"/api/user/"+userId+"/imagini", { responseType: 'json' });
          } 
          

         

           getImage(userId: number, id: number): Observable<string> {
  return this.http.get(BASIC_URL + "/api/user/" + userId + "/imagine/" + id, {
    responseType: 'text'
  });
}

}
