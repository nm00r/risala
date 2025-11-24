import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AllApiService } from '../../../core/services/all-api.service';
import { CourseResponse, InstructorResponse, LectureDTO, ModuleDTO } from '../../../core/interfaces/courses';
import Swal from 'sweetalert2';

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
  duration: string;
}

@Component({
  selector: 'app-create-course',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-course.component.html',
  styleUrl: './create-course.component.scss'
})
export class CreateCourseComponent implements OnInit {
  isSaving: boolean = false;
  isEditMode: boolean = false;
  courseId: string | null = null;
  instructors: InstructorResponse[] = [];
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

  modules: Module[] = [];

  constructor(
    private apiService: AllApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.courseId = params['id'];
        // التحقق من أن courseId ليس null قبل الاستخدام
        if (this.courseId) {
          this.loadCourseData(this.courseId);
        }
      }
    });
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.apiService.getAllInstructors().subscribe({
      next: (response: InstructorResponse[]) => {
        this.instructors = response;
      },
      error: (error) => {
        console.error('Error loading instructors:', error);
      }
    });
  }

  loadCourseData(courseId: string): void {
    Swal.fire({
      title: 'جاري التحميل...',
      html: 'يرجى الانتظار',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.apiService.getCourseById(courseId).subscribe({
      next: (course: CourseResponse) => {
        console.log('Course Data:', course);
        
        this.courseForm = {
          title: course.title || '',
          description: course.description || '',
          startDate: this.formatDateForInput(course.startDate),
          endDate: this.formatDateForInput(course.endDate),
          price: course.price?.toString() || '',
          typeStatus: course.typeStatus || 'Active',
          instructorId: course.instructorId || '',
          contentType: course.contentType || '',
          courseDetails: ''
        };

        if (course.imageUrl) {
          this.imagePreview = course.imageUrl;
        }

        this.loadModulesAndLectures(courseId);
      },
      error: (error) => {
        console.error('Error loading course:', error);
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'حدث خطأ في تحميل بيانات الدورة',
          confirmButtonColor: '#ef4444'
        }).then(() => {
          this.router.navigate(['/courses']);
        });
      }
    });
  }

  loadModulesAndLectures(courseId: string): void {
    this.apiService.getModulesByCourse(courseId).subscribe({
      next: (modules) => {
        console.log('Modules Data:', modules);
        
        const modulePromises = modules.map(module => 
          new Promise<Module>((resolve) => {
            this.apiService.getLecturesByModule(module.id).subscribe({
              next: (lectures) => {
                console.log(`Lectures for Module ${module.id}:`, lectures);
                
                resolve({
                  id: module.id,
                  title: module.title,
                  description: module.description,
                  lectures: lectures.map(lecture => ({
                    id: lecture.id,
                    title: lecture.title,
                    scheduledAt: this.formatDateForInput(lecture.scheduledAt),
                    duration: '0'
                  })),
                  isExpanded: false
                });
              },
              error: () => {
                resolve({
                  id: module.id,
                  title: module.title,
                  description: module.description,
                  lectures: [],
                  isExpanded: false
                });
              }
            });
          })
        );

        Promise.all(modulePromises).then(loadedModules => {
          this.modules = loadedModules;
          console.log('Final Modules with Lectures:', this.modules);
          Swal.close();
        });
      },
      error: (error) => {
        console.error('Error loading modules:', error);
        Swal.close();
      }
    });
  }

  formatDateForInput(isoDate: string): string {
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

  isCourseFormValid(): boolean {
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
        if (module.id && this.isEditMode) {
          this.apiService.deleteModule(module.id).subscribe({
            next: () => {
              this.modules.splice(index, 1);
              Swal.fire({
                icon: 'success',
                title: 'تم الحذف',
                text: 'تم حذف المحتوى بنجاح',
                confirmButtonColor: '#10b981',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: () => {
              Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ في حذف المحتوى',
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
      scheduledAt: '',
      duration: ''
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
        if (lecture.id && this.isEditMode) {
          this.apiService.deleteLecture(lecture.id).subscribe({
            next: () => {
              this.modules[moduleIndex].lectures.splice(lectureIndex, 1);
              Swal.fire({
                icon: 'success',
                title: 'تم الحذف',
                text: 'تم حذف المحاضرة بنجاح',
                confirmButtonColor: '#10b981',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: () => {
              Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ في حذف المحاضرة',
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

  async saveCompleteData(): Promise<void> {
    if (!this.isCourseFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى ملء جميع حقول الدورة المطلوبة',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    this.isSaving = true;

    Swal.fire({
      title: this.isEditMode ? 'جاري التحديث...' : 'جاري الحفظ...',
      html: 'يرجى الانتظار',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      if (this.isEditMode && this.courseId) {
        await this.updateCourse();
      } else {
        await this.createNewCourse();
      }
    } catch (error: any) {
      console.error('Error saving course:', error);
      
      let errorMessage = 'حدث خطأ في حفظ الدورة';
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
  }

  async createNewCourse(): Promise<void> {
    const validModules = this.modules.filter(m => m.title?.trim() && m.description?.trim());
    if (validModules.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى إضافة محتوى واحد على الأقل مع عنوان ووصف',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#f59e0b'
      });
      this.isSaving = false;
      return;
    }

    const formData = new FormData();
    formData.append('Title', this.courseForm.title.trim());
    formData.append('Description', this.courseForm.description.trim());
    formData.append('TypeStatus', this.courseForm.typeStatus);
    formData.append('StartDate', new Date(this.courseForm.startDate).toISOString());
    formData.append('EndDate', new Date(this.courseForm.endDate).toISOString());
    formData.append('Price', this.courseForm.price);
    formData.append('InstructorId', this.courseForm.instructorId);
    formData.append('ContentType', this.courseForm.contentType.trim());
    formData.append('CourseDetails', this.courseForm.courseDetails || '');
    
    if (this.selectedImageFile) {
      formData.append('ImageFile', this.selectedImageFile, this.selectedImageFile.name);
    }

    const modulesData = validModules.map(module => ({
      title: module.title.trim(),
      description: module.description.trim(),
      lectures: module.lectures
        .filter(l => l.title?.trim() && l.scheduledAt)
        .map(lecture => ({
          title: lecture.title.trim(),
          scheduledAt: new Date(lecture.scheduledAt).toISOString(),
          duration: lecture.duration || '0'
        }))
    }));

    formData.append('Modules', JSON.stringify(modulesData));

    const response = await this.apiService.createCourseWithContent(formData).toPromise();
    console.log('Create Course Response:', response);

    this.isSaving = false;
    
    Swal.fire({
      icon: 'success',
      title: 'تم الحفظ! 🎉',
      html: `
        <p>تم إنشاء الدورة بنجاح مع:</p>
        <ul style="text-align: right; list-style: none; padding: 0;">
          <li>✅ ${validModules.length} محتوى</li>
          <li>✅ ${this.getTotalLectures()} محاضرة</li>
        </ul>
      `,
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#10b981',
      timer: 3000
    }).then(() => {
      this.router.navigate(['/courses']);
    });
  }

  async updateCourse(): Promise<void> {
    if (!this.courseId) return;

    const courseUpdateData = {
      id: this.courseId,
      title: this.courseForm.title.trim(),
      description: this.courseForm.description.trim(),
      startDate: new Date(this.courseForm.startDate).toISOString(),
      endDate: new Date(this.courseForm.endDate).toISOString(),
      price: parseFloat(this.courseForm.price),
      typeStatus: this.courseForm.typeStatus,
      instructorId: this.courseForm.instructorId,
      imageUrl: this.imagePreview || '',
      contentType: this.courseForm.contentType.trim(),
      courseDetails: this.courseForm.courseDetails || ''
    };

    const response = await this.apiService.updateCourse(this.courseId, courseUpdateData).toPromise();
    console.log('Update Course Response:', response);

    for (const module of this.modules) {
      if (module.title?.trim() && module.description?.trim()) {
        if (module.id) {
          const moduleUpdateData = {
            title: module.title.trim(),
            description: module.description.trim(),
            courseId: this.courseId
          };
          const moduleResponse = await this.apiService.updateModule(module.id, moduleUpdateData).toPromise();
          console.log('Update Module Response:', moduleResponse);

          for (const lecture of module.lectures) {
            if (lecture.title?.trim() && lecture.scheduledAt) {
              if (lecture.id) {
                const lectureUpdateData = {
                  title: lecture.title.trim(),
                  scheduledAt: new Date(lecture.scheduledAt).toISOString(),
                  moduleId: module.id,
                  courseId: this.courseId
                };
                const lectureResponse = await this.apiService.updateLecture(lecture.id, lectureUpdateData).toPromise();
                console.log('Update Lecture Response:', lectureResponse);
              } else {
                const lectureCreateData = {
                  title: lecture.title.trim(),
                  scheduledAt: new Date(lecture.scheduledAt).toISOString(),
                  moduleId: module.id,
                  courseId: this.courseId
                };
                const lectureResponse = await this.apiService.createLecture(lectureCreateData).toPromise();
                console.log('Create Lecture Response:', lectureResponse);
              }
            }
          }
        } else {
          const moduleCreateData = {
            title: module.title.trim(),
            description: module.description.trim(),
            courseId: this.courseId
          };
          const moduleResponse = await this.apiService.createModule(moduleCreateData).toPromise();
          console.log('Create Module Response:', moduleResponse);

          // التحقق من أن moduleResponse ليس undefined وأن له id
          if (moduleResponse && moduleResponse.id) {
            for (const lecture of module.lectures) {
              if (lecture.title?.trim() && lecture.scheduledAt) {
                const lectureCreateData = {
                  title: lecture.title.trim(),
                  scheduledAt: new Date(lecture.scheduledAt).toISOString(),
                  moduleId: moduleResponse.id,
                  courseId: this.courseId
                };
                const lectureResponse = await this.apiService.createLecture(lectureCreateData).toPromise();
                console.log('Create Lecture Response:', lectureResponse);
              }
            }
          }
        }
      }
    }

    this.isSaving = false;
    
    Swal.fire({
      icon: 'success',
      title: 'تم التحديث! 🎉',
      text: 'تم تحديث الدورة بنجاح',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#10b981',
      timer: 3000
    }).then(() => {
      this.router.navigate(['/courses']);
    });
  }

  private getTotalLectures(): number {
    return this.modules.reduce((total, module) => {
      if (module.lectures && Array.isArray(module.lectures)) {
        return total + module.lectures.filter(l => l.title?.trim() && l.scheduledAt).length;
      }
      return total;
    }, 0);
  }

  cancel(): void {
    Swal.fire({
      title: 'هل تريد المغادرة؟',
      text: 'سيتم فقدان التغييرات غير المحفوظة',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، غادر',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/courses']);
      }
    });
  }
}