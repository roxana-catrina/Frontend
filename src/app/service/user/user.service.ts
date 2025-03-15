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

          uploadImage(userId: number, file: File) {
            const formData = new FormData();
            formData.append('file', file);
          //  formData.append('userId',userId.toString);
            return this.http.post(BASIC_URL+"/api/user/"+userId+"/imagine", formData);
          }
        
        
          getUserImages(userId: number) {
            const token = localStorage.getItem('token');  // presupunând că token-ul este salvat în localStorage
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
            return this.http.get(BASIC_URL+"/api/user/"+userId+"/imagini", { responseType: 'json' });
          } 
          

          /*deleteImage(imageData: string, selectedIndex: number, imagini: Imagine[], userId: string | null, callback: () => void) {
            const token = localStorage.getItem('token');
            const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
            
            // Send the image data in the request body
            return this.http.delete(`${BASIC_URL}/api/user/${userId}/imagini`, {
              headers: headers,
              body: { imageData: imageData }
            }).subscribe({
              next: () => {
                imagini.splice(selectedIndex, 1);
                callback();
              },
              error: (error) => {
                console.error('Error deleting image:', error);
              }
            });
          }*/

            getImage(userId:number,id:number):Observable<any>{
              return this.http.get(BASIC_URL+"/api/user/"+userId+"/imagine/"+id);
            }
}
