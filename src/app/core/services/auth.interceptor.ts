
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // الحصول على الـ Token
    const token = this.authService.getToken();
    
    // إضافة الـ Token للطلب إذا كان موجوداً
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // إذا كان الخطأ 401 (غير مصرح)
        if (error.status === 401) {
          // تسجيل خروج المستخدم
          this.authService.logout();
          // إعادة توجيه لصفحة تسجيل الدخول
          this.router.navigate(['/login']);
        }
        
        return throwError(() => error);
      })
    );
  }
}
