import { Component, inject, OnInit } from '@angular/core';
import { LoginService } from '../../service/serviceLogin/login.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../models/user';
@Component({
  selector: 'app-login',
  standalone: false,
  
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent   {
  loginForm!:FormGroup;
constructor(
  private service: LoginService,
  private fb: FormBuilder,
  private router: Router
) {
  this.loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    parola: ['', Validators.required]
  });
}

ngOnInit(){
  
}
login(){
  const credentials = { email: this.loginForm.value.email, parola: this.loginForm.value.parola };
  this.service.login(credentials).subscribe();
  this.router.navigateByUrl("");
  console.log("Autentificare reusita");
}
/*login(){
  this.service.login(this.loginForm.value).subscribe(data=>{
    console.log(data);
  });

}*/

/*login() {
  const email = this.loginForm.value.email;
  const parola= this.loginForm.value.parola;

  this.service.login(email, parola).subscribe({
    next: (user: User) => {
      console.log('Autentificare reușită:', user);
      // Poți să faci ceva cu datele utilizatorului (de exemplu, să le salvezi în aplicație)
    },
    error: (error: any) => {
      console.error('Eroare la autentificare:', error);
      // Poți să gestionezi erorile, cum ar fi afișarea unui mesaj de eroare
    }
  });}*/

}