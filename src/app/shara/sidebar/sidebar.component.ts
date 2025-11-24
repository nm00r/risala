import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';


export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  badge?: number;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() isOpen: boolean = true;
  @Output() menuItemSelected = new EventEmitter<string>();
  
  menuItems: MenuItem[] = [
    { id: 'dashboard', icon: 'bi-speedometer2', label: 'لوحة التحكم', route: '/' },
    { id: 'students', icon: 'bi-people', label: 'قائمة الطلاب', route: '/requests', badge: 24 },
    { id: 'teachers', icon: 'bi-person-badge', label: 'إدارة المعلمين', route: '/teachers' },
    { id: 'courses', icon: 'bi-journal-bookmark', label: 'إدارة الدورات', route: '/courses' },
    { id: 'exams-management', icon: 'bi-calendar-check', label: 'إدارة الاختبارات', route: '/tests' },
   
    { id: 'questions', icon: 'bi-patch-question', label: 'قائمة الأسئلة', route: '/questions' },
    // { id: 'answers', icon: 'bi-check-circle', label: 'قائمة الإجابات', route: '/answers' }
  ];

  bottomMenuItems: MenuItem[] = [
   
    { id: 'logout', icon: 'bi-box-arrow-right', label: 'تسجيل الخروج', route: '/logout' }
  ];

  currentUser: any = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  selectMenuItem(menuId: string) {
    this.menuItemSelected.emit(menuId);
  }

  navigateTo(menuItem: MenuItem) {
    // التعامل مع تسجيل الخروج
    if (menuItem.id === 'logout') {
      this.logout();
      return;
    }
    
    this.router.navigate([menuItem.route]);
    this.selectMenuItem(menuItem.id);
  }

  logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}