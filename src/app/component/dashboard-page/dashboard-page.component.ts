import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableAction, TableColumn, TableComponent } from '../../shara/table/table.component';
import { Student, StudentForTable, Instructor, InstructorResponse, CourseResponse } from '../../core/interfaces/courses';
import { AllApiService } from '../../core/services/all-api.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent implements OnInit {
  showAddStudentModal = false;
  isLoading = false;
  errorMessage = '';
  currentUserName = '';
  activeTable: 'students' | 'instructors' = 'students';

  studentForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: 'M',
    password: '',
    userName: ''
  };

  stats = {
    totalStudents: 0,
    totalTeachers: 0
  };

  students: StudentForTable[] = [];
  originalStudents: Student[] = [];
  courses: CourseResponse[] = [];
  enrollmentsMap: Map<string, string> = new Map();

  instructors: Instructor[] = [];
  originalInstructors: InstructorResponse[] = [];

  studentTableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, width: '150px' },
    { key: 'joinDate', label: 'تاريخ الانضمام', sortable: true },
    { key: 'course', label: 'الدورة المشترك بها', sortable: true },
    { key: 'name', label: 'اسم الطالب', sortable: true },
    { key: 'phone', label: 'رقم الهاتف', sortable: true },
    { key: 'gender', label: 'الجنس', sortable: true }
  ];

  instructorTableColumns: TableColumn[] = [
    { key: 'id', label: 'الكود ID', sortable: true, width: '100px' },
    { key: 'name', label: 'اسم المعلم', sortable: true },
    { key: 'phone', label: 'رقم الهاتف', sortable: true },
    { key: 'gender', label: 'النوع', sortable: true, align: 'center' },
    { key: 'courses', label: 'الدورات المشترك فيها', sortable: false },
    { key: 'joinDate', label: 'تاريخ الانضمام', sortable: true }
  ];

  studentTableActions: TableAction[] = [];

  instructorTableActions: TableAction[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private apiService: AllApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCourses();
    this.loadInstructors();
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserName = currentUser.firstName || currentUser.email || 'المستخدم';
    }
  }

  loadCourses(): void {
    this.apiService.getAllCourses().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.courses = response;
        } else if (response.isSuccess && response.value) {
          this.courses = response.value;
        } else {
          this.courses = [];
        }
        this.loadEnrollments();
      },
      error: () => {
        this.courses = [];
        this.loadEnrollments();
      }
    });
  }

  loadEnrollments(): void {
    this.apiService.getAllEnrollments().subscribe({
      next: (response: any) => {
        let enrollmentsData: any[];
        
        if (Array.isArray(response)) {
          enrollmentsData = response;
        } else if (response.isSuccess && response.value) {
          enrollmentsData = response.value;
        } else {
          enrollmentsData = [];
        }

        this.enrollmentsMap.clear();
        enrollmentsData.forEach(enrollment => {
          this.enrollmentsMap.set(enrollment.studentId, enrollment.courseId);
        });

        this.loadStudents();
      },
      error: () => {
        this.loadStudents();
      }
    });
  }

  switchToStudents(): void {
    this.activeTable = 'students';
    this.currentPage = 1;
  }

  switchToInstructors(): void {
    this.activeTable = 'instructors';
    this.currentPage = 1;
  }

  loadStudents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getAllStudents().subscribe({
      next: (response: any) => {
        let studentsData: Student[];
        
        if (Array.isArray(response)) {
          studentsData = response;
        } else if (response.isSuccess && response.value) {
          studentsData = response.value;
        } else {
          studentsData = [];
        }

        this.originalStudents = studentsData;
        this.students = this.transformStudentsData(studentsData);
        this.stats.totalStudents = this.students.length;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'حدث خطأ في تحميل بيانات الطلاب';
        this.isLoading = false;
      }
    });
  }

  loadInstructors(): void {
    this.apiService.getAllInstructors().subscribe({
      next: (response: InstructorResponse[]) => {
        this.originalInstructors = response;
        this.instructors = response.map(instructor => this.mapApiInstructorToLocal(instructor));
        this.stats.totalTeachers = this.instructors.length;
      },
      error: () => {
        this.errorMessage = 'حدث خطأ في تحميل بيانات المعلمين';
      }
    });
  }

  private mapApiInstructorToLocal(apiInstructor: InstructorResponse): Instructor {
    const coursesNames = apiInstructor.courses && apiInstructor.courses.length > 0 
      ? apiInstructor.courses.join('، ') 
      : '';
    
    return {
      id: apiInstructor.id,
      name: `${apiInstructor.firstName} ${apiInstructor.lastName}`,
      phone: apiInstructor.phoneNumber,
      gender: apiInstructor.gender === 'M' ? 'ذكر' : apiInstructor.gender === 'F' ? 'أنثى' : 'غير محدد',
      courses: coursesNames,
      joinDate: new Date().toLocaleDateString('ar-EG')
    };
  }

  transformStudentsData(students: Student[]): StudentForTable[] {
    return students.map(student => {
      const fullName = `${student.firstName} ${student.lastName}`;
      const colors = ['4F46E5', '059669', 'DC2626', 'EA580C', '7C3AED', '0891B2', 'DB2777'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      let courseName = '';
      const enrolledCourseId = this.enrollmentsMap.get(student.id);
      
      if (enrolledCourseId) {
        const course = this.courses.find(c => c.id === enrolledCourseId);
        if (course) {
          courseName = course.title;
        }
      }

      return {
        id: student.id,
        name: fullName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=${randomColor}&color=fff`,
        course: courseName,
        joinDate: this.getCurrentDate(),
        phone: student.phoneNumber,
        status: 'قيد المراجعة' as const,
        gender: student.gender === 'M' ? 'ذكر' : 'أنثى',
        email: student.email
      };
    });
  }

  onRowClick(item: StudentForTable | Instructor): void {}

  onSearch(searchTerm: string): void {
    if (this.activeTable === 'students') {
      this.searchStudents(searchTerm);
    } else {
      this.searchInstructors(searchTerm);
    }
  }

  searchStudents(searchTerm: string): void {
    if (!searchTerm) {
      this.students = this.transformStudentsData(this.originalStudents);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = this.originalStudents.filter(student => 
      student.firstName.toLowerCase().includes(term) ||
      student.lastName.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      student.phoneNumber.includes(term)
    );
    
    this.students = this.transformStudentsData(filtered);
  }

  searchInstructors(searchTerm: string): void {
    if (!searchTerm) {
      this.instructors = this.originalInstructors.map(i => this.mapApiInstructorToLocal(i));
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = this.originalInstructors.filter(instructor => 
      instructor.firstName.toLowerCase().includes(term) ||
      instructor.lastName.toLowerCase().includes(term) ||
      instructor.phoneNumber.includes(term)
    );
    
    this.instructors = filtered.map(i => this.mapApiInstructorToLocal(i));
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onSelectionChange(selectedRows: any[]): void {}

  onSortChange(sort: { column: string, direction: 'asc' | 'desc' }): void {
    if (this.activeTable === 'students') {
      this.students.sort((a, b) => {
        const aValue = (a as any)[sort.column];
        const bValue = (b as any)[sort.column];
        
        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      this.instructors.sort((a, b) => {
        const aValue = (a as any)[sort.column];
        const bValue = (b as any)[sort.column];
        
        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  openAddStudentModal(): void {
    this.showAddStudentModal = true;
    this.resetForm();
  }

  closeAddStudentModal(): void {
    this.showAddStudentModal = false;
    this.resetForm();
  }

  addStudent(): void {
    if (!this.isFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى ملء جميع الحقول المطلوبة',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    this.isLoading = true;

    const newStudent = {
      firstName: this.studentForm.firstName,
      lastName: this.studentForm.lastName,
      email: this.studentForm.email,
      phoneNumber: this.studentForm.phoneNumber,
      gender: this.studentForm.gender,
      password: this.studentForm.password,
      userName: this.studentForm.userName || this.studentForm.email
    };

    this.apiService.createStudent(newStudent).subscribe({
      next: () => {
        this.loadStudents();
        this.closeAddStudentModal();
        Swal.fire({
          icon: 'success',
          title: 'نجح',
          text: 'تم إضافة الطالب بنجاح',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#10b981',
          timer: 2000
        });
        this.isLoading = false;
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'حدث خطأ في إضافة الطالب',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#ef4444'
        });
        this.isLoading = false;
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.studentForm.firstName &&
      this.studentForm.lastName &&
      this.studentForm.email &&
      this.studentForm.phoneNumber &&
      this.studentForm.password
    );
  }

  resetForm(): void {
    this.studentForm = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      gender: 'M',
      password: '',
      userName: ''
    };
  }

  getCurrentDate(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }
}