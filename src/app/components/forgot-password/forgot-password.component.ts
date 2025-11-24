import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PasswordResetService } from '../../service/password-reset/password-reset.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone: false
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isSubmitting = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  sendVerificationCode() {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.message = '';
    const email = this.forgotPasswordForm.get('email')?.value;

    console.log('🔵 Trimit cerere pentru email:', email);
    console.log('🔵 Request body:', { email });

    this.passwordResetService.sendVerificationCode(email).subscribe({
      next: (response) => {
        console.log('✅ Răspuns SUCCESS:', response);
        this.messageType = 'success';
        this.message = 'Codul de verificare a fost trimis pe email!';
        
        // Redirecționează către pagina de resetare cu email-ul în query params
        setTimeout(() => {
          this.router.navigate(['/reset-password'], { queryParams: { email } });
        }, 1500);
      },
      error: (error) => {
        console.error('❌ Eroare la trimitere:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error body:', error.error);
        console.error('❌ URL:', error.url);
        
        this.messageType = 'error';
        this.message = error.error?.message || 'Eroare la trimiterea codului. Verificați email-ul!';
        this.isSubmitting = false;
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/authenticate']);
  }
}
