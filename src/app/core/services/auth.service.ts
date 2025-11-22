import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  gender?: string;
  phoneNumber?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  sessionId?: string;
  user?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://nafzill-001-site1.ltempurl.com/api/Auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    if (!this.isBrowser) {
      return;
    }

    try {
      const userData = localStorage.getItem('userData');
      const token = localStorage.getItem('userToken');
      
      if (userData && token) {
        const parsedData = JSON.parse(userData);
        this.currentUserSubject.next(parsedData);
 
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials, { headers })
      .pipe(
        map(response => {
         
          
          if (this.isBrowser) {
         
            const token = response.accessToken || response.token;
            if (token) {
              localStorage.setItem('userToken', token);
              
            } else {
              console.error('❌ No token found in response');
            }
            if (response.refreshToken) {
              localStorage.setItem('refreshToken', response.refreshToken);
            
            }
            localStorage.setItem('userData', JSON.stringify(response));
            this.currentUserSubject.next(response);
            
            const savedToken = localStorage.getItem('userToken');
           
          } else {
          
          }
          
          return response;
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, userData, { headers })
      .pipe(
        tap(response => {
          if (!this.isBrowser) return;
          const token = response.accessToken || response.token;
          if (token) {
            localStorage.setItem('userToken', token);
          }
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }
          localStorage.setItem('userData', JSON.stringify(response));
          this.currentUserSubject.next(response);
        })
      );
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
   
    }
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) {
 
      return false;
    }
    
    const token = localStorage.getItem('userToken');
    const isLoggedIn = !!token;
    
    // console.log('🔍 isLoggedIn check:', {
    //   hasToken: isLoggedIn,
    //   tokenLength: token?.length || 0,
    //   tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
    // });
    
    return isLoggedIn;
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem('userToken');
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
}