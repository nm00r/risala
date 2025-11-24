import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableAction, TableColumn, TableComponent } from '../../shara/table/table.component';
import { AllApiService } from '../../core/services/all-api.service';
import { CourseResponse, InstructorResponse } from '../../core/interfaces/courses';
import Swal from 'sweetalert2';

interface Course {
  id: string;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  studentsCount: number;
  price: string;
  description?: string;
  instructor: string;
}

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent implements OnInit {
  isLoading: boolean = false;

  stats = {
    totalCourses: 0,
    activeCourses: 0
  };

  courses: Course[] = [];
  instructors: InstructorResponse[] = [];
  instructorsMap: Map<string, string> = new Map();

  tableColumns: TableColumn[] = [
    { key: 'id', label: 'الكود ID', sortable: true, width: '100px' },
    { key: 'instructor', label: 'اسم المدرب', sortable: true },
    { key: 'category', label: 'وصف الدورة', sortable: true },
    { key: 'name', label: 'اسم الدورة', sortable: true },
    { key: 'startDate', label: 'تاريخ البداية', sortable: true },
    { key: 'endDate', label: 'تاريخ الانتهاء', sortable: true }
  ];

  tableActions: TableAction[] = [
    {
      label: 'تعديل',
      icon: 'bi bi-pencil',
      class: 'text-primary',
      handler: (course: Course) => this.editCourse(course.id)
    },
    {
      label: 'حذف',
      icon: 'bi bi-trash',
      class: 'text-danger',
      handler: (course: Course) => this.deleteCourse(course.id)
    }
  ];

  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private apiService: AllApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.apiService.getAllInstructors().subscribe({
      next: (response: InstructorResponse[]) => {
        this.instructors = response;
        this.instructorsMap.clear();
        response.forEach(instructor => {
          this.instructorsMap.set(instructor.id, `${instructor.firstName} ${instructor.lastName}`);
        });
        this.loadCourses();
      },
      error: () => {
        this.loadCourses();
      }
    });
  }

  loadCourses(): void {
    this.isLoading = true;
    this.apiService.getAllCourses().subscribe({
      next: (response: CourseResponse[]) => {
        this.courses = response.map(course => this.mapApiCourseToLocal(course));
        this.updateStats();
        this.isLoading = false;
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'حدث خطأ في تحميل الدورات',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#ef4444'
        });
        this.isLoading = false;
      }
    });
  }

  private mapApiCourseToLocal(apiCourse: CourseResponse): Course {
    let instructorName = '-';
    if (apiCourse.instructorId) {
      instructorName = this.instructorsMap.get(apiCourse.instructorId) || '-';
    }

    return {
      id: apiCourse.id,
      name: apiCourse.title,
      category: apiCourse.description || '-',
      startDate: this.formatDateFromISO(apiCourse.startDate),
      endDate: this.formatDateFromISO(apiCourse.endDate),
      studentsCount: 0,
      price: `${apiCourse.price.toFixed(2)} ریال`,
      description: apiCourse.description,
      instructor: instructorName
    };
  }

  private updateStats(): void {
    this.stats.totalCourses = this.courses.length;
    const now = new Date();
    this.stats.activeCourses = this.courses.filter(course => {
      const endDate = this.parseLocalDate(course.endDate);
      return endDate >= now;
    }).length;
  }

  private formatDateFromISO(isoDate: string): string {
    try {
      const date = new Date(isoDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '-';
    }
  }

  private parseLocalDate(dateString: string): Date {
    try {
      const [day, month, year] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } catch (error) {
      return new Date();
    }
  }

  openAddCourseModal(): void {
    this.router.navigate(['/courses/create']);
  }

  editCourse(courseId: string): void {
    this.router.navigate(['/courses/edit', courseId]);
  }

  onRowClick(course: Course): void {}
  onSearch(searchTerm: string): void {}
  onPageChange(page: number): void {
    this.currentPage = page;
  }
  onSelectionChange(selectedRows: Course[]): void {}
  onSortChange(sort: { column: string, direction: 'asc' | 'desc' }): void {}

  deleteCourse(courseId: string): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف الدورة وجميع محتوياتها',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteCourse(courseId).subscribe({
          next: () => {
            this.loadCourses();
            Swal.fire({
              icon: 'success',
              title: 'تم الحذف',
              text: 'تم حذف الدورة بنجاح',
              confirmButtonColor: '#10b981',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'خطأ',
              text: 'حدث خطأ في حذف الدورة',
              confirmButtonText: 'حسناً',
              confirmButtonColor: '#ef4444'
            });
          }
        });
      }
    });
  }
}