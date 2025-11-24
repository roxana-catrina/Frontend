import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordResetService } from '../../service/password-reset/password-reset.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  standalone: false
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  email = '';
  isSubmitting = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Obține email-ul din query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  resetPassword() {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.message = '';

    const { code, newPassword } = this.resetPasswordForm.value;

    this.passwordResetService.resetPasswordWithCode(this.email, code, newPassword).subscribe({
      next: (response) => {
        this.messageType = 'success';
        this.message = 'Parola a fost schimbată cu succes!';
        
        // Redirecționează către pagina de login după 2 secunde
        setTimeout(() => {
          this.router.navigate(['/authenticate']);
        }, 2000);
      },
      error: (error) => {
        this.messageType = 'error';
        this.message = error.error?.message || 'Cod invalid sau expirat. Încearcă din nou!';
        this.isSubmitting = false;
      }
    });
  }

  resendCode() {
    this.passwordResetService.sendVerificationCode(this.email).subscribe({
      next: (response) => {
        this.messageType = 'success';
        this.message = 'Codul a fost retrimis pe email!';
      },
      error: (error) => {
        this.messageType = 'error';
        this.message = 'Eroare la retrimiterea codului.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/authenticate']);
  }
}
