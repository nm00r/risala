import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AllApiService } from '../../../core/services/all-api.service';
import { InstructorResponse, LectureDTO, ModuleDTO } from '../../../core/interfaces/courses';
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
}

@Component({
  selector: 'app-create-course',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-course.component.html',
  styleUrl: './create-course.component.scss'
})
export class CreateCourseComponent implements OnInit {
  isEditMode: boolean = false;
  courseId: string | null = null;
  isLoading: boolean = false;
  isSaving: boolean = false;
  showEditModal: boolean = false;

  instructors: InstructorResponse[] = [];
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  // بيانات الكورس للعرض فقط (disabled)
  courseData = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    price: '',
    typeStatus: 'Active',
    instructorId: '',
    instructorName: '',
    imageUrl: '',
    contentType: '',
    courseDetails: ''
  };

  // بيانات الكورس للتعديل في الـ Modal
  editForm = {
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
    this.loadInstructors();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.courseId = params['id'];
        this.loadCourse(params['id']);
        this.loadModules(params['id']);
      }
    });
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

  loadCourse(id: string): void {
    this.isLoading = true;
    this.apiService.getCourseById(id).subscribe({
      next: (course: any) => {
        const instructor = this.instructors.find(i => i.id === course.instructorId);
        const instructorName = instructor ? `${instructor.firstName} ${instructor.lastName}` : '-';

        this.courseData = {
          title: course.title || '',
          description: course.description || '',
          startDate: this.convertISOToInputDate(course.startDate),
          endDate: this.convertISOToInputDate(course.endDate),
          price: course.price ? course.price.toString() : '',
          typeStatus: course.typeStatus || 'Active',
          instructorId: course.instructorId || '',
          instructorName: instructorName,
          imageUrl: course.imageUrl || '',
          contentType: course.contentType || '',
          courseDetails: course.courseDetails || ''
        };
        
        if (course.imageUrl) {
          this.imagePreview = course.imageUrl;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading course:', error);
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'حدث خطأ في تحميل بيانات الدورة',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#ef4444'
        });
        this.isLoading = false;
      }
    });
  }

  loadModules(courseId: string): void {
    this.apiService.getModulesByCourse(courseId).subscribe({
      next: (modules) => {
        // التحقق من أن modules مصفوفة
        if (!Array.isArray(modules)) {
          console.error('Modules response is not an array:', modules);
          this.modules = [];
          return;
        }

        this.modules = modules.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          lectures: [],
          isExpanded: false
        }));
        
        // تحميل المحاضرات لكل module
        this.modules.forEach(module => {
          if (module.id) {
            this.loadLectures(module.id, module);
          }
        });
      },
      error: (error) => {
        console.error('Error loading modules:', error);
        this.modules = [];
      }
    });
  }

  loadLectures(moduleId: string, module: Module): void {
    this.apiService.getLecturesByModule(moduleId).subscribe({
      next: (lectures) => {
        // التحقق من أن lectures مصفوفة
        if (!Array.isArray(lectures)) {
          console.error('Lectures response is not an array:', lectures);
          module.lectures = [];
          return;
        }

        module.lectures = lectures.map(l => ({
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

  private convertISOToInputDate(isoDate: string): string {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error converting date:', error);
      return '';
    }
  }

  // ==================== EDIT MODAL ====================

  openEditCourseModal(): void {
    this.showEditModal = true;
    this.selectedImageFile = null;
    
    // نسخ البيانات من courseData إلى editForm
    this.editForm = {
      title: this.courseData.title,
      description: this.courseData.description,
      startDate: this.courseData.startDate,
      endDate: this.courseData.endDate,
      price: this.courseData.price,
      typeStatus: this.courseData.typeStatus,
      instructorId: this.courseData.instructorId,
      contentType: this.courseData.contentType,
      courseDetails: this.courseData.courseDetails
    };
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedImageFile = null;
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

  isEditFormValid(): boolean {
    return !!(
      this.editForm.title?.trim() &&
      this.editForm.description?.trim() &&
      this.editForm.startDate &&
      this.editForm.endDate &&
      this.editForm.price &&
      this.editForm.instructorId &&
      this.editForm.contentType?.trim()
    );
  }

  saveBasicCourseData(): void {
    if (!this.isEditFormValid()) {
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

    const updateData: any = {
      id: this.courseId,
      title: this.editForm.title,
      description: this.editForm.description,
      startDate: new Date(this.editForm.startDate).toISOString(),
      endDate: new Date(this.editForm.endDate).toISOString(),
      price: parseFloat(this.editForm.price),
      typeStatus: this.editForm.typeStatus,
      instructorId: this.editForm.instructorId,
      contentType: this.editForm.contentType,
      courseDetails: this.editForm.courseDetails
    };

    this.apiService.updateCourse(this.courseId!, updateData).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeEditModal();
        
        Swal.fire({
          icon: 'success',
          title: 'تم التحديث! ✅',
          text: 'تم تحديث بيانات الدورة بنجاح',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#10b981',
          timer: 2000,
          showConfirmButton: false
        });
        
        // إعادة تحميل بيانات الدورة
        this.loadCourse(this.courseId!);
      },
      error: (error) => {
        console.error('❌ Error updating course:', error);
        
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

  // ==================== MODULES METHODS ====================

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
              console.error('Error deleting module:', error);
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
              console.error('Error deleting lecture:', error);
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

  // ==================== SAVE MODULES & LECTURES ====================

  async saveModulesAndLectures(): Promise<void> {
    if (!this.courseId) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'معرف الدورة غير موجود',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    // التحقق من وجود محتويات للحفظ
    const validModules = this.modules.filter(m => m.title?.trim() && m.description?.trim());
    if (validModules.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى إضافة محتوى واحد على الأقل مع عنوان ووصف',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    this.isSaving = true;

    try {
      await this.saveAllModulesAndLectures(this.courseId);
      
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
        this.router.navigate(['/courses']);
      });
      
    } catch (error: any) {
      console.error('❌ Error saving modules/lectures:', error);
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
    const validModules = this.modules.filter(m => m.title?.trim() && m.description?.trim());
    console.log(`\n📚 Saving ${validModules.length} modules...`);
    
    let savedModules = 0;
    let savedLectures = 0;
    
    for (let i = 0; i < this.modules.length; i++) {
      const module = this.modules[i];
      
      if (!module.title?.trim() || !module.description?.trim()) {
        console.warn(`⚠️ Skipping module ${i + 1} - missing title or description`);
        continue;
      }

      try {
        let moduleId: string;
        
        const moduleData: ModuleDTO = {
          title: module.title.trim(),
          description: module.description.trim(),
          courseId: courseId
        };

        if (module.id) {
          // تحديث module موجود
          moduleData.id = module.id;
          const updatedModule = await this.apiService.updateModule(module.id, moduleData).toPromise();
          moduleId = updatedModule!.id;
          console.log(`✅ Updated module: ${module.title}`);
        } else {
          // إنشاء module جديد
          const createdModule = await this.apiService.createModule(moduleData).toPromise();
          moduleId = createdModule!.id;
          console.log(`✅ Created module: ${module.title}`);
        }

        savedModules++;

        // حفظ المحاضرات للـ module
        if (module.lectures && module.lectures.length > 0) {
          const lectureCount = await this.saveModuleLectures(moduleId, courseId, module.lectures);
          savedLectures += lectureCount;
        }
        
      } catch (error: any) {
        console.error(`❌ Error saving module ${i + 1}:`, error);
        throw new Error(`فشل حفظ المحتوى "${module.title}": ${error.error?.message || error.message}`);
      }
    }
    
    console.log(`✅ Total saved: ${savedModules} modules, ${savedLectures} lectures`);
  }

  private async saveModuleLectures(moduleId: string, courseId: string, lectures: Lecture[]): Promise<number> {
    let savedCount = 0;
    
    for (const lecture of lectures) {
      if (!lecture.title?.trim() || !lecture.scheduledAt) {
        console.warn(`⚠️ Skipping lecture - missing title or date`);
        continue;
      }

      try {
        const lectureData: LectureDTO = {
          title: lecture.title.trim(),
          scheduledAt: new Date(lecture.scheduledAt).toISOString(),
          moduleId: moduleId,
          courseId: courseId
        };

        if (lecture.id) {
          // تحديث lecture موجودة
          lectureData.id = lecture.id;
          await this.apiService.updateLecture(lecture.id, lectureData).toPromise();
          console.log(`  ✅ Updated lecture: ${lecture.title}`);
        } else {
          // إنشاء lecture جديدة
          await this.apiService.createLecture(lectureData).toPromise();
          console.log(`  ✅ Created lecture: ${lecture.title}`);
        }
        
        savedCount++;
      } catch (error: any) {
        console.error(`  ❌ Error saving lecture:`, error);
        throw new Error(`فشل حفظ المحاضرة "${lecture.title}": ${error.error?.message || error.message}`);
      }
    }
    
    return savedCount;
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