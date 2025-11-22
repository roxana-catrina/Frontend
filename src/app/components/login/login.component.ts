import { Component, Inject, OnInit } from '@angular/core';
import { LoginService } from '../../service/serviceLogin/login.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../models/user';
import { AuthService } from '../../service/serviceAuth/auth.service';
import { StorageService } from '../../service/storage/storage.service';

@Component({
  selector: 'app-login',
  standalone: false,

  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {
  loginForm!: FormGroup;
  isSpinning: boolean = false;
  errorMessage: string = '';
  showError: boolean = false;
  
  constructor(
    private service: LoginService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,


  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      parola: ['', Validators.required]
    });
  }

  ngOnInit() { }

  login() {
    interface LoginResponse {
      id: string | null;
      jwt: string;
      nume: string;
    }

    interface User {
      id: string;
      nume: string;
    }

    // Ascunde mesajul de eroare anterior
    this.showError = false;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res: LoginResponse) => {
        console.log(res);
        if (res.id != null) {
          const user: User = { id: res.id , nume:res.nume};
          StorageService.saveUser(user);
          StorageService.saveToken(res.jwt);

          if (StorageService.isUserLoggedIn()) {
            this.router.navigate(['/dashboard']);
          }
        }
      },
      error: (err) => {
        console.error('Login error:', err);

        if (err.status === 401) {
          this.errorMessage = 'Parola introdusă este incorectă. Vă rugăm verificați și încercați din nou.';
        } else if (err.status === 404) {
          this.errorMessage = 'Acest utilizator nu există. Verificați datele sau creați un cont.';
        } else {
          this.errorMessage = 'A apărut o eroare. Vă rugăm încercați din nou.';
        }
        
        this.showError = true;
        
        // Ascunde automat mesajul după 5 secunde
        setTimeout(() => {
          this.showError = false;
        }, 5000);
      }
    });


  }


}
