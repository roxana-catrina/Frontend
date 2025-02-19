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
    }

    interface User {
      id: string;
    }


    this.authService.login(this.loginForm.value).subscribe({
      next: (res: LoginResponse) => {
        console.log(res);
        if (res.id != null) {
          const user: User = { id: res.id };
          StorageService.saveUser(user);
          StorageService.saveToken(res.jwt);

          if (StorageService.isUserLoggedIn()) {
            this.router.navigate(['/dashboard']);
          }
        }
      },
      error: (err) => {
        console.error('Eroare autentificare:', err);

        if (err.status === 401) {
          alert('Parola introdusă este greșită. Verifică și încearcă din nou.');
        } else if (err.status === 404) {
          alert('Acest utilizator nu există. Verifică datele sau creează un cont.');
        } else {
          alert('A apărut o eroare. Vă rugăm să încercați din nou.');
        }
      }
    });


  }


}
