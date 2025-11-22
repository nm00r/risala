import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shara/header/header.component';
import { SidebarComponent } from './shara/sidebar/sidebar.component';
import { HttpClientModule } from '@angular/common/http';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'risala-dashboard';
  isSidebarOpen = true;
  isMobile = false;
  showLayout = true; // للتحكم في إظهار/إخفاء الـ Header والـ Sidebar
  private resizeListener?: () => void;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    // مراقبة تغييرات المسار
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.url);
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkIfMobile();
      this.resizeListener = () => this.checkIfMobile();
      window.addEventListener('resize', this.resizeListener);
      
      // فحص المسار الحالي عند بدء التطبيق
      this.checkRoute(this.router.url);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId) && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  // فحص المسار لتحديد إظهار أو إخفاء الـ Layout
  private checkRoute(url: string) {
    // قائمة الصفحات التي لا تحتاج Header و Sidebar
    const publicRoutes = ['/login', '/register', '/forgot-password'];
    this.showLayout = !publicRoutes.some(route => url.includes(route));
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  onMenuItemSelected(menuId: string) {
    console.log('Selected menu:', menuId);
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  private checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
}