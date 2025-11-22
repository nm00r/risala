import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TableAction, TableColumn, TableComponent } from '../../../shara/table/table.component';
import { Router } from '@angular/router';
import { AllApiService } from '../../../core/services/all-api.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

interface Exam {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName?: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  createdAt: string;
  questionsCount?: number;
}

interface TableExam {
  id: string;
  testName: string;
  course: string;
  createdDate: string;
  startDate: string;
  status: string;
  questionsCount: number;
  durationMinutes: number;
}

@Component({
  selector: 'app-tests',
  standalone: true,
  imports: [CommonModule, TableComponent],
  templateUrl: './tests.component.html',
  styleUrl: './tests.component.scss'
})
export class TestsComponent implements OnInit {
  exams: Exam[] = [];
  tests: TableExam[] = [];
  isLoading: boolean = false;
  courses: any[] = [];

  testsTableColumns: TableColumn[] = [
    { key: 'testName', label: 'اسم الاختبار', sortable: true },
    { key: 'course', label: 'الدورة', sortable: true },
    { key: 'durationMinutes', label: 'المدة (دقيقة)', sortable: true, align: 'center' },
    { key: 'questionsCount', label: 'عدد الأسئلة', sortable: true, align: 'center' },
    { key: 'startDate', label: 'تاريخ البداية', sortable: true },
    { key: 'createdDate', label: 'تاريخ الإنشاء', sortable: true },
    { key: 'status', label: 'الحالة', sortable: true, align: 'center' }
  ];

  testsTableActions: TableAction[] = [
    {
      label: 'عرض الأسئلة',
      icon: 'bi bi-list-ul',
      class: 'text-primary',
      handler: (test: TableExam) => this.viewQuestions(test)
    },
    {
      label: 'تعديل',
      icon: 'bi bi-pencil',
      handler: (test: TableExam) => this.editTest(test)
    },
    {
      label: 'حذف',
      icon: 'bi bi-trash',
      class: 'text-danger',
      handler: (test: TableExam) => this.deleteTest(test.id)
    }
  ];

  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private router: Router,
    private apiService: AllApiService
  ) {}

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    this.isLoading = true;
    
    forkJoin({
      exams: this.apiService.getAllExams(),
      courses: this.apiService.getAllCourses()
    }).subscribe({
      next: async (result) => {
        this.courses = result.courses;
        this.exams = result.exams;
        
        this.exams.forEach(exam => {
          const course = this.courses.find(c => c.id === exam.courseId);
          exam.courseName = course ? course.title : 'غير محدد';
        });
        
        for (let exam of this.exams) {
          try {
            const examWithQuestions = await this.apiService.getExamWithQuestions(exam.id).toPromise();
            exam.questionsCount = examWithQuestions?.questions?.length || 0;
          } catch (err) {
            exam.questionsCount = 0;
          }
        }
        
        this.transformExamsToTableData();
        this.isLoading = false;
       
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل تحميل البيانات'
        });
      }
    });
  }

  transformExamsToTableData(): void {
    this.tests = this.exams.map(exam => ({
      id: exam.id,
      testName: exam.title,
      course: exam.courseName || 'غير محدد',
      createdDate: this.formatDate(exam.createdAt),
      startDate: this.formatDate(exam.startDate),
      status: exam.isPublished ? 'منشور' : 'معطل',
      questionsCount: exam.questionsCount || 0,
      durationMinutes: exam.durationMinutes
    }));
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  onRowClick(test: TableExam): void {

  }

  onSearch(searchTerm: string): void {

  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onSelectionChange(selectedRows: TableExam[]): void {

  }

  onSortChange(sort: { column: string, direction: 'asc' | 'desc' }): void {

  }

  createNewTest(): void {
    this.router.navigate(['/tests/create']);
  }

  viewQuestions(test: TableExam): void {
    this.router.navigate(['/tests/questions', test.id]);
  }

  editTest(test: TableExam): void {
    this.router.navigate(['/tests/edit', test.id]);
  }

  deleteTest(testId: string): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف الاختبار وجميع الأسئلة المرتبطة به',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteExam(testId).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'تم الحذف',
              text: 'تم حذف الاختبار بنجاح',
              timer: 2000
            });
            this.loadExams();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'خطأ',
              text: 'فشل حذف الاختبار'
            });
          }
        });
      }
    });
  }
}