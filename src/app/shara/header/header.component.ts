import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  user = {
    name: 'زائر',
    role: 'غير مسجل',
    avatar: 'https://ui-avatars.com/api/?name=Guest&background=gray&color=fff&size=40'
  };

  notificationCount = 3;
  isLoggedIn = false;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // الاشتراك في تغييرات حالة المستخدم
    this.userSubscription = this.authService.currentUser$.subscribe(userData => {
      if (userData) {
        this.isLoggedIn = true;
        this.updateUserDisplay(userData);
      } else {
        this.isLoggedIn = false;
        this.resetUserDisplay();
      }
    });
  }

  ngOnDestroy() {
    // إلغاء الاشتراك عند تدمير المكون
    this.userSubscription?.unsubscribe();
  }

  private updateUserDisplay(userData: any) {
    const firstName = userData.firstName || userData.user?.firstName || 'مستخدم';
    const lastName = userData.lastName || userData.user?.lastName || '';
    const email = userData.email || userData.user?.email || '';
    
    this.user = {
      name: `${firstName} ${lastName}`.trim() || email,
      role: userData.role || 'مستخدم',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=4F46E5&color=fff&size=40`
    };
  }

  private resetUserDisplay() {
    this.user = {
      name: 'زائر',
      role: 'غير مسجل',
      avatar: 'https://ui-avatars.com/api/?name=Guest&background=gray&color=fff&size=40'
    };
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  logout() {
    // تسجيل الخروج
    this.authService.logout();
    
    // إعادة توجيه لصفحة تسجيل الدخول
    this.router.navigate(['/login']);
  }
}