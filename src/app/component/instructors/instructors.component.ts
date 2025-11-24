import { ChangeDetectorRef, Component } from '@angular/core';
import { AllApiService } from '../../core/services/all-api.service';
import { Instructor, InstructorDTO, InstructorResponse } from '../../core/interfaces/courses';
import { TableAction, TableColumn, TableComponent } from '../../shara/table/table.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent],
  templateUrl: './instructors.component.html',
  styleUrl: './instructors.component.scss'
})
export class InstructorsComponent {
  showAddInstructorModal: boolean = false;
  isEditMode: boolean = false;
  selectedInstructorId: string | null = null;
  isLoading: boolean = false;

  instructorForm = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: 'M',
    email: '',
    password: '',
    title: '',
    description: ''
  };

  stats = {
    totalInstructors: 0,
    maleInstructors: 0,
    femaleInstructors: 0
  };

  instructors: Instructor[] = [];

  tableColumns: TableColumn[] = [
    { key: 'id', label: 'الكود ID', sortable: true, width: '100px' },
    { key: 'name', label: 'اسم المعلم', sortable: true },
    { key: 'phone', label: 'رقم الهاتف', sortable: true },
    { key: 'gender', label: 'النوع', sortable: true, align: 'center' },
    { key: 'courses', label: 'الدورات المشترك فيها', sortable: false },
    { key: 'joinDate', label: 'تاريخ الانضمام', sortable: true }
  ];

  tableActions: TableAction[] = [
    {
      label: 'تعديل',
      icon: 'bi bi-pencil',
      handler: (instructor: Instructor) => this.editInstructor(instructor)
    },
    {
      label: 'حذف',
      icon: 'bi bi-trash',
      class: 'text-danger',
      handler: (instructor: Instructor) => this.deleteInstructor(instructor.id)
    }
  ];

  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private apiService: AllApiService,
    private router: Router,
      private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.isLoading = true;
    this.apiService.getAllInstructors().subscribe({
      next: (response: InstructorResponse[]) => {
        this.instructors = response.map(instructor => this.mapApiInstructorToLocal(instructor));
        this.updateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading instructors:', error);
        this.showErrorMessage('حدث خطأ في تحميل المعلمين');
        this.isLoading = false;
      }
    });
  }

  private mapApiInstructorToLocal(apiInstructor: InstructorResponse): Instructor {
    const coursesNames = apiInstructor.courses && apiInstructor.courses.length > 0 
      ? apiInstructor.courses.join('، ') 
      : 'لا يوجد دورات';
    
    return {
      id: apiInstructor.id,
      name: `${apiInstructor.firstName} ${apiInstructor.lastName}`,
      phone: apiInstructor.phoneNumber,
      gender: apiInstructor.gender === 'M' ? 'ذكر' : apiInstructor.gender === 'F' ? 'أنثى' : 'غير محدد',
      courses: coursesNames,
      joinDate: new Date().toLocaleDateString('ar-EG')
    };
  }

  private mapLocalInstructorToApi(includeId: boolean = false): InstructorDTO {
    const instructorData: InstructorDTO = {
      firstName: this.instructorForm.firstName.trim(),
      lastName: this.instructorForm.lastName.trim(),
      phoneNumber: this.instructorForm.phoneNumber.trim(),
      gender: this.instructorForm.gender,
      email: this.instructorForm.email.trim(),
      title: this.instructorForm.title.trim() || '',
      description: this.instructorForm.description.trim()
    };

    if (!this.isEditMode) {
      instructorData.password = this.instructorForm.password;
    }

    if (includeId && this.selectedInstructorId) {
      instructorData.id = this.selectedInstructorId;
    }

    return instructorData;
  }

  private updateStats(): void {
    this.stats.totalInstructors = this.instructors.length;
    this.stats.maleInstructors = this.instructors.filter(i => i.gender === 'ذكر').length;
    this.stats.femaleInstructors = this.instructors.filter(i => i.gender === 'أنثى').length;
  }

  onRowClick(instructor: Instructor): void {
    console.log('Row clicked:', instructor);
  }

  onSearch(searchTerm: string): void {
    console.log('Search term:', searchTerm);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    console.log('Page changed to:', page);
  }

  onSelectionChange(selectedRows: Instructor[]): void {
    console.log('Selected rows:', selectedRows);
  }

  onSortChange(sort: { column: string, direction: 'asc' | 'desc' }): void {
    console.log('Sort changed:', sort);
  }

  editInstructor(instructor: Instructor): void {
    this.isEditMode = true;
    this.selectedInstructorId = instructor.id;
    
    this.apiService.getInstructorById(instructor.id).subscribe({
      next: (response: InstructorResponse) => {
        this.instructorForm = {
          firstName: response.firstName,
          lastName: response.lastName,
          phoneNumber: response.phoneNumber,
          gender: response.gender || 'M',
          email: '',
          password: '',
          title: response.title || '',
          description: response.description || ''
        };
        this.showAddInstructorModal = true;
      },
      error: (error) => {
        console.error('Error loading instructor:', error);
        this.showErrorMessage('حدث خطأ في تحميل بيانات المعلم');
      }
    });
  }

  openAddInstructorModal(): void {
    this.isEditMode = false;
    this.selectedInstructorId = null;
    this.showAddInstructorModal = true;
    this.resetForm();
  }

  closeAddInstructorModal(): void {
    this.showAddInstructorModal = false;
    this.isEditMode = false;
    this.selectedInstructorId = null;
    this.resetForm();
  }
// ==================== Component للتشخيص ====================
// ضع هذا الكود في addInstructor() method

addInstructor(): void {
  if (!this.isFormValid()) {
    Swal.fire({
      icon: 'warning',
      title: 'تنبيه',
      text: 'يرجى ملء جميع الحقول المطلوبة',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#3085d6'
    });
    return;
  }

  this.isLoading = true;

  if (!this.isEditMode) {
    const instructorData = this.mapLocalInstructorToApi(false);
  
    
    this.apiService.createInstructor(instructorData).subscribe({
      next: (response) => {
    
        const newInstructor = this.mapApiInstructorToLocal(response);
  
        
        this.instructors = [...this.instructors, newInstructor];
        this.updateStats();
        this.cdr.detectChanges();

        
        setTimeout(() => {
  
          const countBeforeGet = this.instructors.length;
          
          this.apiService.getAllInstructors().subscribe({
            next: (instructors) => {
           
              instructors.forEach((inst, index) => {
               
              });
              
              const foundNewInstructor = instructors.find(i => i.id === response.id);

              
              if (foundNewInstructor) {
                
              } else {
           
                
              }
              
              this.instructors = instructors.map(instructor => this.mapApiInstructorToLocal(instructor));
              this.updateStats();
              this.cdr.detectChanges();
            
            },
            error: (error) => {
  
              
              if (error.status === 401) {
                console.error('🚨 DIAGNOSIS: Authentication problem!');
                console.error('Token might be expired or invalid');
              } else if (error.status === 0) {
                console.error('🚨 DIAGNOSIS: Network problem!');
                console.error('Cannot reach server or CORS issue');
              } else {
                console.error('🚨 DIAGNOSIS: Server error!');
              }
            }
          });
        }, 2000);
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'تم الإرسال! ✅',
          html: `
            <div style="text-align: right; direction: rtl;">
              <p><strong>تم إرسال البيانات بنجاح!</strong></p>
              <p>ID: ${response.id}</p>
              <p>الاسم: ${response.firstName} ${response.lastName}</p>
              <p><strong>⏰ جاري التحقق من قاعدة البيانات...</strong></p>
              <p style="font-size: 12px; color: #666;">افتح الـ Console لمتابعة التشخيص</p>
            </div>
          `,
          timer: 3000,
          showConfirmButton: false
        });
        
        this.closeAddInstructorModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('═══════════════════════════════════════');
        console.error('❌ STEP 2: POST Request FAILED!');
        console.error('═══════════════════════════════════════');
        console.error('Error:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Details:', error.error);
        
        Swal.fire({
          icon: 'error',
          title: 'فشل الإرسال!',
          text: error.message || 'حدث خطأ غير معروف',
          confirmButtonText: 'حسناً'
        });
        
        this.isLoading = false;
      }
    });
  }
}

  isFormValid(): boolean {
    const baseValidation = !!(
      this.instructorForm.firstName &&
      this.instructorForm.lastName &&
      this.instructorForm.phoneNumber &&
      this.instructorForm.description
    );

    if (this.isEditMode) {
      return baseValidation;
    } else {
      return baseValidation && !!(
        this.instructorForm.email &&
        this.instructorForm.password
      );
    }
  }

  resetForm(): void {
    this.instructorForm = {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      gender: 'M',
      email: '',
      password: '',
      title: '',
      description: ''
    };
  }

  deleteInstructor(instructorId: string): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع عن هذا الإجراء!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف!',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        
        this.apiService.deleteInstructor(instructorId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'تم الحذف!',
              text: 'تم حذف المعلم بنجاح',
              timer: 2000,
              showConfirmButton: false
            });
            
            this.loadInstructors();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error deleting instructor:', error);
            
            Swal.fire({
              icon: 'error',
              title: 'خطأ!',
              text: 'حدث خطأ في حذف المعلم: ' + (error.error?.message || error.message),
              confirmButtonText: 'حسناً',
              confirmButtonColor: '#d33'
            });
            
            this.isLoading = false;
          }
        });
      }
    });
  }

  private showSuccessMessage(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'نجح!',
      text: message,
      timer: 2000,
      showConfirmButton: false
    });
  }

  private showErrorMessage(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'خطأ!',
      text: message,
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#d33'
    });
  }
}