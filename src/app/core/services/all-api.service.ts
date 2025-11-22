import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  Answer, 
  CourseDTO, 
  CourseResponse, 
  CreateAnswerDTO, 
  Question, 
  Student,
  CreateStudentDTO,
  ModuleDTO,
  ModuleResponse,
  LectureDTO,
  LectureResponse,
  InstructorResponse,
  InstructorDTO
} from '../interfaces/courses';

@Injectable({
  providedIn: 'root'
})
export class AllApiService {
  private baseUrl = 'https://nafzill-001-site1.ltempurl.com/api';

  constructor(private http: HttpClient) { }

  // ==================== Helper Methods ====================
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  private addCacheBuster(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${new Date().getTime()}`;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }

  // ==================== Students APIs ====================
  getAllStudents(): Observable<Student[]> {  
    const url = this.addCacheBuster(`${this.baseUrl}/Students`);
    return this.http.get<Student[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getStudentById(id: string): Observable<any> {
    const url = this.addCacheBuster(`${this.baseUrl}/Students/${id}`);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createStudent(student: CreateStudentDTO): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Students`, student, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateStudent(id: string, student: CreateStudentDTO): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/Students/${id}`, student, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteStudent(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Students/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== Courses APIs ====================
  getAllCourses(): Observable<CourseResponse[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Courses`);
    return this.http.get<CourseResponse[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getCourseById(id: string): Observable<CourseResponse> {
    const url = this.addCacheBuster(`${this.baseUrl}/Courses/${id}`);
    return this.http.get<CourseResponse>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createCourse(course: CourseDTO): Observable<CourseResponse> {
    return this.http.post<CourseResponse>(`${this.baseUrl}/Courses`, course, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateCourse(id: string, course: CourseDTO): Observable<CourseResponse> {
    return this.http.put<CourseResponse>(`${this.baseUrl}/Courses/${id}`, course, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Courses/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  createCourseWithFormData(formData: FormData): Observable<any> {
    const token = this.getAuthToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.post<any>(`${this.baseUrl}/Courses`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  // ==================== Modules APIs ====================
  getModuleById(id: string): Observable<ModuleResponse> {
    const url = this.addCacheBuster(`${this.baseUrl}/Modules/${id}`);
    return this.http.get<ModuleResponse>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getModulesByCourse(courseId: string): Observable<ModuleResponse[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Modules/ByCourse/${courseId}`);
    return this.http.get<ModuleResponse[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createModule(module: ModuleDTO): Observable<ModuleResponse> {
    return this.http.post<ModuleResponse>(`${this.baseUrl}/Modules`, module, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateModule(id: string, module: ModuleDTO): Observable<ModuleResponse> {
    return this.http.put<ModuleResponse>(`${this.baseUrl}/Modules/${id}`, module, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteModule(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Modules/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== Lectures APIs ====================
  getLecturesByModule(moduleId: string): Observable<LectureResponse[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Lectures/ByModule/${moduleId}`);
    return this.http.get<LectureResponse[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createLecture(lecture: LectureDTO): Observable<LectureResponse> {
    return this.http.post<LectureResponse>(`${this.baseUrl}/Lectures`, lecture, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateLecture(id: string, lecture: LectureDTO): Observable<LectureResponse> {
    return this.http.put<LectureResponse>(`${this.baseUrl}/Lectures/${id}`, lecture, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteLecture(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Lectures/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== Questions APIs ====================
  getAllQuestions(): Observable<Question[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Questions`);
    return this.http.get<Question[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getQuestionById(id: string): Observable<Question> {
    const url = this.addCacheBuster(`${this.baseUrl}/Questions/${id}`);
    return this.http.get<Question>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createQuestion(formData: FormData): Observable<Question> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post<Question>(`${this.baseUrl}/Questions`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  updateQuestion(id: string, questionData: any): Observable<Question> {
    return this.http.put<Question>(`${this.baseUrl}/Questions/${id}`, questionData, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteQuestion(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Questions/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== Answers APIs ====================
  getAllAnswers(): Observable<Answer[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Answers`);
    return this.http.get<Answer[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAnswersByQuestion(questionId: string): Observable<Answer[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Answers/ByQuestion/${questionId}`);
    return this.http.get<Answer[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAnswerById(id: string): Observable<Answer> {
    const url = this.addCacheBuster(`${this.baseUrl}/Answers/${id}`);
    return this.http.get<Answer>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createAnswer(answer: CreateAnswerDTO): Observable<Answer> {
    return this.http.post<Answer>(`${this.baseUrl}/Answers`, answer, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateAnswer(id: string, answer: CreateAnswerDTO): Observable<Answer> {
    return this.http.put<Answer>(`${this.baseUrl}/Answers/${id}`, answer, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteAnswer(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Answers/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== Exams APIs ====================
  getAllExams(): Observable<any[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Exams`);
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getExamById(id: string): Observable<any> {
    const url = this.addCacheBuster(`${this.baseUrl}/Exams/${id}`);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getExamWithQuestions(examId: string): Observable<any> {
    const url = this.addCacheBuster(`${this.baseUrl}/Exams/ByQuestions/${examId}`);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getExamsByCourse(courseId: string): Observable<any[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Exams/ByCourse/${courseId}`);
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createExam(exam: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Exams`, exam, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateExam(id: string, exam: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/Exams/${id}`, exam, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteExam(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Exams/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  publishExam(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Exams/${id}/publish`, {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  unpublishExam(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Exams/${id}/unpublish`, {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }
  
  // ==================== Instructors APIs ====================
  getAllInstructors(): Observable<InstructorResponse[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Instructors`);
    return this.http.get<InstructorResponse[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  getInstructorById(id: string): Observable<InstructorResponse> {
    const url = this.addCacheBuster(`${this.baseUrl}/Instructors/${id}`);
    return this.http.get<InstructorResponse>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  createInstructor(instructor: InstructorDTO): Observable<InstructorResponse> {
    return this.http.post<InstructorResponse>(
      `${this.baseUrl}/Instructors/create`, 
      instructor,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  updateInstructor(id: string, instructor: InstructorDTO): Observable<InstructorResponse> {
    return this.http.put<InstructorResponse>(
      `${this.baseUrl}/Instructors/${id}`, 
      instructor, 
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  deleteInstructor(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Instructors/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== Enrollments APIs ====================
  createEnrollment(enrollment: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Enrollments`, enrollment, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }

  getAllEnrollments(): Observable<any[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Enrollments`);
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getEnrollmentsByStudent(studentId: string): Observable<any[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Enrollments/ByStudent/${studentId}`);
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getEnrollmentsByCourse(courseId: string): Observable<any[]> {
    const url = this.addCacheBuster(`${this.baseUrl}/Enrollments/ByCourse/${courseId}`);
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteEnrollment(studentId: string, courseId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Enrollments/${studentId}/${courseId}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }
}