import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        setTimeout(() => {
          this.loading = false;
          const token = localStorage.getItem('userToken');
          
          if (token) {
            this.router.navigate(['/'], { replaceUrl: true });
          }
        }, 300);
      },
      error: (error) => {
        this.loading = false;
        
        if (error.status === 401 || error.status === 400) {
          this.errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        } else if (error.status === 0) {
          this.errorMessage = 'خطأ في الاتصال بالخادم';
        } else {
          this.errorMessage = error.error?.message || 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى';
        }
      }
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}