import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableAction, TableColumn, TableComponent } from '../../shara/table/table.component';
import { AllApiService } from '../../core/services/all-api.service';
import { CourseResponse, InstructorResponse, ModuleDTO, LectureDTO } from '../../core/interfaces/courses';
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

interface Module {
  id?: string;
  title: string;
  description: string;
  lectures: Lecture[];
  isExpanded?: boolean;
}

interface Lecture {
  id?: string;
  title: string;
  scheduledAt: string;
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
  showCreateModal: boolean = false;
  showContentModal: boolean = false;
  isSaving: boolean = false;
  isEditMode: boolean = false;
  editingCourseId: string | null = null;
  managingCourseId: string | null = null;

  stats = {
    totalCourses: 0,
    activeCourses: 0
  };

  courses: Course[] = [];
  instructors: InstructorResponse[] = [];
  instructorsMap: Map<string, string> = new Map();
  modules: Module[] = [];

  // Modal Form Data
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;
  courseForm = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    price: '',
    typeStatus: 'Active',
    instructorId: '',
    contentType: '',
    courseDetails: ''
  };

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
      label: 'تعديل بيانات الدورة',
      icon: 'bi bi-pencil-square',
      class: 'text-warning',
      handler: (course: Course) => this.openEditModal(course.id)
    },
    {
      label: 'إدارة المحتويات والمحاضرات',
      icon: 'bi bi-collection',
      class: 'text-success',
      handler: (course: Course) => this.openContentModal(course.id)
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

  private convertISOToInputDate(isoDate: string): string {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  }

  // ==================== CREATE/EDIT COURSE MODAL ====================
  
  openAddCourseModal(): void {
    this.showCreateModal = true;
    this.isEditMode = false;
    this.editingCourseId = null;
    this.resetModalForm();
  }

  openEditModal(courseId: string): void {
    this.showCreateModal = true;
    this.isEditMode = true;
    this.editingCourseId = courseId;
    
    this.apiService.getCourseById(courseId).subscribe({
      next: (courseData: any) => {
        this.courseForm = {
          title: courseData.title || '',
          description: courseData.description || '',
          startDate: this.convertISOToInputDate(courseData.startDate),
          endDate: this.convertISOToInputDate(courseData.endDate),
          price: courseData.price ? courseData.price.toString() : '',
          typeStatus: courseData.typeStatus || 'Active',
          instructorId: courseData.instructorId || '',
          contentType: courseData.contentType || '',
          courseDetails: courseData.courseDetails || ''
        };
        
        if (courseData.imageUrl) {
          this.imagePreview = courseData.imageUrl;
        }
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.closeCreateModal();
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'حدث خطأ في تحميل بيانات الدورة',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.isEditMode = false;
    this.editingCourseId = null;
    this.resetModalForm();
  }

  resetModalForm(): void {
    this.courseForm = {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      price: '',
      typeStatus: 'Active',
      instructorId: '',
      contentType: '',
      courseDetails: ''
    };
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  isModalFormValid(): boolean {
    return !!(
      this.courseForm.title?.trim() &&
      this.courseForm.description?.trim() &&
      this.courseForm.startDate &&
      this.courseForm.endDate &&
      this.courseForm.price &&
      this.courseForm.instructorId &&
      this.courseForm.contentType?.trim()
    );
  }

  saveCourse(): void {
    if (!this.isModalFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى ملء جميع الحقول المطلوبة',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.editingCourseId) {
      this.updateCourseData();
    } else {
      this.createNewCourse();
    }
  }

  private createNewCourse(): void {
    const formData = new FormData();
    formData.append('Title', this.courseForm.title.trim());
    formData.append('Description', this.courseForm.description.trim());
    formData.append('TypeStatus', this.courseForm.typeStatus);
    formData.append('StartDate', new Date(this.courseForm.startDate).toISOString());
    formData.append('EndDate', new Date(this.courseForm.endDate).toISOString());
    formData.append('Price', this.courseForm.price);
    formData.append('InstructorId', this.courseForm.instructorId);
    formData.append('ContentType', this.courseForm.contentType.trim());
    formData.append('courseDetails', this.courseForm.courseDetails || ''); 
    
    if (this.selectedImageFile) {
      formData.append('ImageFile', this.selectedImageFile, this.selectedImageFile.name);
    }

    this.apiService.createCourseWithFormData(formData).subscribe({
      next: (course: any) => {
        this.isSaving = false;
        this.closeCreateModal();
        
        Swal.fire({
          icon: 'success',
          title: 'تم إنشاء الدورة! 🎉',
          html: `
            <p class="mb-2">تم إنشاء الدورة "<strong>${course.title}</strong>" بنجاح</p>
            <p class="text-muted small">يمكنك الآن إضافة المحتويات والمحاضرات</p>
          `,
          confirmButtonText: 'إضافة المحتويات الآن',
          showCancelButton: true,
          cancelButtonText: 'لاحقاً',
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#6b7280',
          allowOutsideClick: false
        }).then((result) => {
          if (result.isConfirmed) {
            this.openContentModal(course.id);
          } else {
            this.loadCourses();
          }
        });
      },
      error: (error) => {
        let errorMessage = 'حدث خطأ في إنشاء الدورة';
        if (error.error?.errors) {
          const errors = Object.values(error.error.errors).flat();
          errorMessage = errors.join('\n');
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: errorMessage,
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#ef4444'
        });
        
        this.isSaving = false;
      }
    });
  }

  private updateCourseData(): void {
    const updateData: any = {
      id: this.editingCourseId,
      title: this.courseForm.title,
      description: this.courseForm.description,
      startDate: new Date(this.courseForm.startDate).toISOString(),
      endDate: new Date(this.courseForm.endDate).toISOString(),
      price: parseFloat(this.courseForm.price),
      typeStatus: this.courseForm.typeStatus,
      instructorId: this.courseForm.instructorId,
      contentType: this.courseForm.contentType,
      courseDetails: this.courseForm.courseDetails
    };

    this.apiService.updateCourse(this.editingCourseId!, updateData).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeCreateModal();
        
        Swal.fire({
          icon: 'success',
          title: 'تم التحديث! ✅',
          text: 'تم تحديث بيانات الدورة بنجاح',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#10b981',
          timer: 2000,
          showConfirmButton: false
        });
        
        this.loadCourses();
      },
      error: (error) => {
        let errorMessage = 'حدث خطأ في تحديث الدورة';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: errorMessage,
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#ef4444'
        });
        
        this.isSaving = false;
      }
    });
  }

  // ==================== CONTENT MANAGEMENT MODAL ====================

  openContentModal(courseId: string): void {
    this.showContentModal = true;
    this.managingCourseId = courseId;
    this.modules = [];
    this.loadModulesForCourse(courseId);
  }

  closeContentModal(): void {
    this.showContentModal = false;
    this.managingCourseId = null;
    this.modules = [];
  }

  loadModulesForCourse(courseId: string): void {
    this.apiService.getModulesByCourse(courseId).subscribe({
      next: (response: any) => {
        // التعامل مع الـ response سواء كان object أو array
        let modulesData = [];
        
        if (response && response.value && Array.isArray(response.value)) {
          modulesData = response.value;
        } else if (Array.isArray(response)) {
          modulesData = response;
        } else {
          console.warn('Unexpected modules response format:', response);
          modulesData = [];
        }

        this.modules = modulesData.map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          lectures: [],
          isExpanded: false
        }));
        
        this.modules.forEach(module => {
          if (module.id) {
            this.loadLecturesForModule(module.id, module);
          }
        });
      },
      error: (error) => {
        console.error('Error loading modules:', error);
        this.modules = [];
      }
    });
  }

  loadLecturesForModule(moduleId: string, module: Module): void {
    this.apiService.getLecturesByModule(moduleId).subscribe({
      next: (response: any) => {
        // التعامل مع الـ response
        let lecturesData = [];
        
        if (response && response.value && Array.isArray(response.value)) {
          lecturesData = response.value;
        } else if (Array.isArray(response)) {
          lecturesData = response;
        } else {
          console.warn('Unexpected lectures response format:', response);
          lecturesData = [];
        }

        module.lectures = lecturesData.map((l: any) => ({
          id: l.id,
          title: l.title,
          scheduledAt: this.convertISOToInputDate(l.scheduledAt)
        }));
      },
      error: (error) => {
        console.error('Error loading lectures:', error);
        module.lectures = [];
      }
    });
  }

  addModule(): void {
    this.modules.push({
      title: '',
      description: '',
      lectures: [],
      isExpanded: true
    });
  }

  removeModule(index: number): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'هل تريد حذف هذا المحتوى وجميع محاضراته؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        const module = this.modules[index];
        
        if (module.id) {
          this.apiService.deleteModule(module.id).subscribe({
            next: () => {
              this.modules.splice(index, 1);
              Swal.fire({
                icon: 'success',
                title: 'تم الحذف',
                text: 'تم حذف المحتوى بنجاح',
                timer: 1500,
                showConfirmButton: false
              });
            },
            error: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ في حذف المحتوى',
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#ef4444'
              });
            }
          });
        } else {
          this.modules.splice(index, 1);
        }
      }
    });
  }

  toggleModule(index: number): void {
    this.modules[index].isExpanded = !this.modules[index].isExpanded;
  }

  addLecture(moduleIndex: number): void {
    this.modules[moduleIndex].lectures.push({
      title: '',
      scheduledAt: ''
    });
  }

  removeLecture(moduleIndex: number, lectureIndex: number): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'هل تريد حذف هذه المحاضرة؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        const lecture = this.modules[moduleIndex].lectures[lectureIndex];
        
        if (lecture.id) {
          this.apiService.deleteLecture(lecture.id).subscribe({
            next: () => {
              this.modules[moduleIndex].lectures.splice(lectureIndex, 1);
              Swal.fire({
                icon: 'success',
                title: 'تم الحذف',
                text: 'تم حذف المحاضرة بنجاح',
                timer: 1500,
                showConfirmButton: false
              });
            },
            error: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ في حذف المحاضرة',
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#ef4444'
              });
            }
          });
        } else {
          this.modules[moduleIndex].lectures.splice(lectureIndex, 1);
        }
      }
    });
  }

  async saveModulesAndLectures(): Promise<void> {
    if (!this.managingCourseId) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'معرف الدورة غير موجود',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const validModules = this.modules.filter(m => m.title?.trim() && m.description?.trim());
    if (validModules.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى إضافة محتوى واحد على الأقل',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    this.isSaving = true;

    try {
      await this.saveAllModulesAndLectures(this.managingCourseId);
      
      this.isSaving = false;
      Swal.fire({
        icon: 'success',
        title: 'تم الحفظ! 🎉',
        html: `
          <p>تم حفظ المحتويات بنجاح:</p>
          <ul style="text-align: right; list-style: none; padding: 0;">
            <li>✅ ${validModules.length} محتوى</li>
            <li>✅ ${this.getTotalLectures()} محاضرة</li>
          </ul>
        `,
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#10b981',
        timer: 3000
      }).then(() => {
        this.closeContentModal();
        this.loadCourses();
      });
      
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: error.message || 'حدث خطأ في حفظ المحتويات',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#ef4444'
      });
      this.isSaving = false;
    }
  }

  private async saveAllModulesAndLectures(courseId: string): Promise<void> {
    for (const module of this.modules) {
      if (!module.title?.trim() || !module.description?.trim()) continue;

      try {
        let moduleId: string;
        
        const moduleData: ModuleDTO = {
          title: module.title.trim(),
          description: module.description.trim(),
          courseId: courseId
        };

        if (module.id) {
          moduleData.id = module.id;
          const updated = await this.apiService.updateModule(module.id, moduleData).toPromise();
          moduleId = updated!.id;
        } else {
          const created = await this.apiService.createModule(moduleData).toPromise();
          moduleId = created!.id;
        }

        if (module.lectures && module.lectures.length > 0) {
          await this.saveModuleLectures(moduleId, courseId, module.lectures);
        }
      } catch (error: any) {
        throw new Error(`فشل حفظ المحتوى "${module.title}"`);
      }
    }
  }

  private async saveModuleLectures(moduleId: string, courseId: string, lectures: Lecture[]): Promise<void> {
    for (const lecture of lectures) {
      if (!lecture.title?.trim() || !lecture.scheduledAt) continue;

      try {
        const lectureData: LectureDTO = {
          title: lecture.title.trim(),
          scheduledAt: new Date(lecture.scheduledAt).toISOString(),
          moduleId: moduleId,
          courseId: courseId
        };

        if (lecture.id) {
          lectureData.id = lecture.id;
          await this.apiService.updateLecture(lecture.id, lectureData).toPromise();
        } else {
          await this.apiService.createLecture(lectureData).toPromise();
        }
      } catch (error) {
        throw new Error(`فشل حفظ المحاضرة "${lecture.title}"`);
      }
    }
  }

  private getTotalLectures(): number {
    return this.modules.reduce((total, module) => {
      if (module.lectures && Array.isArray(module.lectures)) {
        return total + module.lectures.filter(l => l.title?.trim() && l.scheduledAt).length;
      }
      return total;
    }, 0);
  }

  // ==================== TABLE ACTIONS ====================

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