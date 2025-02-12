import { Component } from '@angular/core';
import { LoginService } from '../../service/serviceLogin/login.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: false,
  
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm!:FormGroup;
constructor(
  private service: LoginService,
  private fb: FormBuilder,
  private router:Router
){}

ngOnInit(){
  this.loginForm = this.fb.group({
    email: ['',Validators.required],
    parola: ['',Validators.required]
  });
}
login(){
  this.service.login(this.loginForm.value).subscribe(data=>{
    console.log(data);
  });
}
}