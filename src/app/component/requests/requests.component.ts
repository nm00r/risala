import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TableAction, TableColumn, TableComponent } from '../../shara/table/table.component';
import { FormsModule } from '@angular/forms';
import { AllApiService } from '../../core/services/all-api.service';
import { Student, StudentForTable, CourseResponse } from '../../core/interfaces/courses';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, TableComponent, FormsModule],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class RequestsComponent implements OnInit {
  
  isLoading = false;
  errorMessage = '';
  showEnrollModal = false;
  isEnrolling = false;

  enrollmentData = {
    studentId: '',
    courseId: '',
    enrollmentDate: new Date().toISOString()
  };

  selectedStudent: StudentForTable = {
    id: '',
    name: 'اختر طالباً من القائمة',
    avatar: 'https://ui-avatars.com/api/?name=Student&background=4F46E5&color=fff&size=120',
    course: '',
    joinDate: '',
    phone: '',
    status: 'قيد المراجعة',
    gender: '',
    email: ''
  };

  students: StudentForTable[] = [];
  originalStudents: Student[] = [];
  courses: CourseResponse[] = [];
  enrollmentsMap: Map<string, string> = new Map();

  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, width: '150px' },
    { key: 'joinDate', label: 'تاريخ الانضمام', sortable: true },
    { key: 'course', label: 'الدورة المشترك بها', sortable: true },
    { key: 'name', label: 'اسم الطالب', sortable: true },
    { key: 'status', label: 'الحالة', sortable: true, align: 'center' },
    { key: 'phone', label: 'رقم الهاتف', sortable: true },
    { key: 'gender', label: 'الجنس', sortable: true }
  ];

  tableActions: TableAction[] = [
    {
      label: 'عرض التفاصيل',
      icon: 'bi bi-eye',
      class: 'text-primary',
      handler: (student: StudentForTable) => this.viewDetails(student)
    },
    {
      label: 'قبول',
      icon: 'bi bi-check-circle',
      class: 'text-success',
      handler: (student: StudentForTable) => this.approveStudent(student)
    },
    {
      label: 'رفض',
      icon: 'bi bi-x-circle',
      class: 'text-danger',
      handler: (student: StudentForTable) => this.rejectStudent(student)
    }
  ];

  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(private apiService: AllApiService) {}

  ngOnInit(): void {
    this.loadCourses();
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
        
        if (this.students.length > 0) {
          this.selectedStudent = { ...this.students[0] };
        }
        
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'حدث خطأ في تحميل بيانات الطلاب';
        this.isLoading = false;
      }
    });
  }

  transformStudentsData(students: Student[]): StudentForTable[] {
    return students.map(student => {
      const fullName = `${student.firstName} ${student.lastName}`;
      const colors = ['4F46E5', '059669', 'DC2626', 'EA580C', '7C3AED', '0891B2', 'DB2777'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const statuses: ('قيد المراجعة' | 'مقبول' | 'مرفوض')[] = ['قيد المراجعة', 'مقبول', 'مرفوض'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

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
        status: randomStatus,
        gender: student.gender === 'M' ? 'ذكر' : 'أنثى',
        email: student.email
      };
    });
  }

  openEnrollModal(): void {
    if (!this.selectedStudent.id) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى اختيار طالب أولاً',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
    
    this.enrollmentData = {
      studentId: this.selectedStudent.id,
      courseId: '',
      enrollmentDate: new Date().toISOString()
    };
    
    this.showEnrollModal = true;
  }

  closeEnrollModal(): void {
    this.showEnrollModal = false;
    this.enrollmentData = {
      studentId: '',
      courseId: '',
      enrollmentDate: new Date().toISOString()
    };
  }

  enrollStudent(): void {
    if (!this.enrollmentData.courseId) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى اختيار دورة',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    this.isEnrolling = true;

    this.apiService.createEnrollment(this.enrollmentData).subscribe({
      next: () => {
        const selectedCourse = this.courses.find(c => c.id === this.enrollmentData.courseId);
        
        if (selectedCourse) {
          this.enrollmentsMap.set(this.selectedStudent.id, selectedCourse.id);
          
          const index = this.students.findIndex(s => s.id === this.selectedStudent.id);
          if (index !== -1) {
            this.students[index].course = selectedCourse.title;
            this.students[index].status = 'مقبول';
            this.selectedStudent = { ...this.students[index] };
          }
        }
        
        this.isEnrolling = false;
        this.closeEnrollModal();
        
        Swal.fire({
          icon: 'success',
          title: 'نجح',
          text: 'تم تسجيل الطالب في الدورة بنجاح',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#10b981',
          timer: 2000
        });
      },
      error: () => {
        this.isEnrolling = false;
        
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'حدث خطأ في تسجيل الطالب في الدورة',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  onRowClick(student: StudentForTable): void {
    this.selectedStudent = { ...student };
  }

  onSearch(searchTerm: string): void {
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

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onSelectionChange(selectedRows: StudentForTable[]): void {}

  onSortChange(sort: { column: string, direction: 'asc' | 'desc' }): void {
    this.students.sort((a, b) => {
      const aValue = (a as any)[sort.column];
      const bValue = (b as any)[sort.column];
      
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  viewDetails(student: StudentForTable): void {
    this.selectedStudent = { ...student };
  }

  approveStudent(student?: StudentForTable): void {
    const targetStudent = student || this.selectedStudent;
    
    targetStudent.status = 'مقبول';
    
    const index = this.students.findIndex(s => s.id === targetStudent.id);
    if (index !== -1) {
      this.students[index].status = 'مقبول';
    }
    
    Swal.fire({
      icon: 'success',
      title: 'نجح',
      text: 'تم قبول الطالب بنجاح',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#10b981',
      timer: 2000
    });
  }

  rejectStudent(student?: StudentForTable): void {
    const targetStudent = student || this.selectedStudent;
    
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'هل تريد حذف هذا الطالب؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteStudent(targetStudent.id).subscribe({
          next: () => {
            this.students = this.students.filter(s => s.id !== targetStudent.id);
            this.originalStudents = this.originalStudents.filter(s => s.id !== targetStudent.id);
            
            if (this.selectedStudent.id === targetStudent.id && this.students.length > 0) {
              this.selectedStudent = { ...this.students[0] };
            } else if (this.students.length === 0) {
              this.selectedStudent = {
                id: '',
                name: 'اختر طالباً من القائمة',
                avatar: 'https://ui-avatars.com/api/?name=Student&background=4F46E5&color=fff&size=120',
                course: '',
                joinDate: '',
                phone: '',
                status: 'قيد المراجعة',
                gender: '',
                email: ''
              };
            }
            
            Swal.fire({
              icon: 'success',
              title: 'تم الحذف',
              text: 'تم حذف الطالب بنجاح',
              confirmButtonText: 'حسناً',
              confirmButtonColor: '#10b981',
              timer: 2000
            });
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'خطأ',
              text: 'حدث خطأ في حذف الطالب',
              confirmButtonText: 'حسناً',
              confirmButtonColor: '#ef4444'
            });
          }
        });
      }
    });
  }

  private getCurrentDate(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }
}