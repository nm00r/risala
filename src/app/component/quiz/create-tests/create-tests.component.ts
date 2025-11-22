import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseResponse, Question } from '../../../core/interfaces/courses';
import { AllApiService } from '../../../core/services/all-api.service';
import Swal from 'sweetalert2';

interface QuestionWithSelection extends Question {
  selected: boolean;
  expanded: boolean;
}

interface ExamDTO {
  title: string;
  description: string;
  courseId: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  questions: Question[];
}

@Component({
  selector: 'app-create-tests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-tests.component.html',
  styleUrl: './create-tests.component.scss'
})
export class CreateTestsComponent {
  isEditMode: boolean = false;
  examId: string | null = null;

  examForm = {
    title: '',
    description: '',
    courseId: '',
    durationMinutes: 60,
    passingGrade: 60,
    startDate: '',
    endDate: ''
  };

  publishAfterSave: boolean = false;

  courses: CourseResponse[] = [];

  allQuestions: QuestionWithSelection[] = [];
  
  selectedQuestions: Question[] = [];

  isLoadingCourses = false;
  isLoadingQuestions = false;
  isSaving = false;

  searchQuery: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: AllApiService
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadQuestions();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.examId = id;
        this.loadExamData(id);
      }
    });
  }

  loadCourses(): void {
    this.isLoadingCourses = true;
    this.apiService.getAllCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.isLoadingCourses = false;
      },
      error: (err) => {
        this.isLoadingCourses = false;
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل تحميل الدورات'
        });
      }
    });
  }

  loadQuestions(): void {
    this.isLoadingQuestions = true;
    this.apiService.getAllQuestions().subscribe({
      next: (data) => {
        this.allQuestions = data.map(q => ({
          ...q,
          selected: false,
          expanded: false
        }));
        this.isLoadingQuestions = false;
        
        this.allQuestions.forEach(question => {
          this.loadAnswersForQuestion(question.id);
        });
      },
      error: (err) => {
        this.isLoadingQuestions = false;
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل تحميل الأسئلة'
        });
      }
    });
  }

  loadAnswersForQuestion(questionId: string): void {
    this.apiService.getAnswersByQuestion(questionId).subscribe({
      next: (answers) => {
        const question = this.allQuestions.find(q => q.id === questionId);
        if (question) {
          question.answers = answers;
        }
      },
      error: (err) => {
        const question = this.allQuestions.find(q => q.id === questionId);
        if (question) {
          question.answers = [];
        }
      }
    });
  }

  loadExamData(examId: string): void {
    this.apiService.getExamById(examId).subscribe({
      next: (data) => {
        this.examForm = {
          title: data.title,
          description: data.description,
          courseId: data.courseId,
          durationMinutes: data.durationMinutes,
          passingGrade: 60,
          startDate: new Date(data.startDate).toISOString().split('T')[0],
          endDate: new Date(data.endDate).toISOString().split('T')[0]
        };
        
        if (data.questions && data.questions.length > 0) {
          this.selectedQuestions = data.questions;
          
          this.selectedQuestions.forEach(selectedQ => {
            const question = this.allQuestions.find(q => q.id === selectedQ.id);
            if (question) {
              question.selected = true;
            }
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل تحميل بيانات الاختبار'
        });
      }
    });
  }

  cancel(): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم فقدان جميع التغييرات',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، إلغاء',
      cancelButtonText: 'رجوع'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/tests']);
      }
    });
  }

  saveExam(publishNow: boolean = false): void {
    if (!this.isFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى ملء جميع الحقول المطلوبة'
      });
      return;
    }

    if (this.selectedQuestions.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى إضافة سؤال واحد على الأقل'
      });
      return;
    }

    this.isSaving = true;

    const examDTO: ExamDTO = {
      title: this.examForm.title,
      description: this.examForm.description,
      courseId: this.examForm.courseId,
      durationMinutes: this.examForm.durationMinutes,
      startDate: new Date(this.examForm.startDate).toISOString(),
      endDate: new Date(this.examForm.endDate).toISOString(),
      questions: this.selectedQuestions
    };

    if (this.isEditMode && this.examId) {
      this.apiService.updateExam(this.examId, examDTO).subscribe({
        next: (response) => {
          if (publishNow) {
            this.publishExam(response.id || this.examId!);
          } else {
            Swal.fire({
              icon: 'success',
              title: 'نجح',
              text: 'تم تحديث الاختبار بنجاح',
              timer: 2000
            });
            this.isSaving = false;
            this.router.navigate(['/tests']);
          }
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل تحديث الاختبار: ' + (err.error?.message || err.message)
          });
          this.isSaving = false;
        }
      });
    } else {
      this.apiService.createExam(examDTO).subscribe({
        next: (response) => {
          if (publishNow) {
            this.publishExam(response.id);
          } else {
            Swal.fire({
              icon: 'success',
              title: 'نجح',
              text: 'تم إنشاء الاختبار بنجاح',
              timer: 2000
            });
            this.isSaving = false;
            this.router.navigate(['/tests']);
          }
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل إنشاء الاختبار: ' + (err.error?.message || err.message)
          });
          this.isSaving = false;
        }
      });
    }
  }

  publishExam(examId: string): void {
    this.apiService.publishExam(examId).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'نجح',
          text: 'تم حفظ ونشر الاختبار بنجاح',
          timer: 2000
        });
        this.isSaving = false;
        this.router.navigate(['/tests']);
      },
      error: (err) => {
        Swal.fire({
          icon: 'warning',
          title: 'تحذير',
          text: 'تم حفظ الاختبار ولكن فشل النشر. يمكنك نشره من قائمة الاختبارات.'
        });
        this.isSaving = false;
        this.router.navigate(['/tests']);
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.examForm.title &&
      this.examForm.courseId &&
      this.examForm.startDate &&
      this.examForm.endDate &&
      this.examForm.durationMinutes > 0
    );
  }

  addQuestionToExam(question: QuestionWithSelection): void {
    if (this.isQuestionSelected(question.id)) {
      return;
    }

    this.selectedQuestions.push({
      id: question.id,
      text: question.text,
      point: question.point,
      imageUrl: question.imageUrl,
      answers: question.answers
    });

    question.selected = true;
  }

  isQuestionSelected(questionId: string): boolean {
    return this.selectedQuestions.some(q => q.id === questionId);
  }

  removeSelectedQuestion(questionId: string): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف هذا السؤال من الاختبار',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        this.selectedQuestions = this.selectedQuestions.filter(q => q.id !== questionId);
        
        const question = this.allQuestions.find(q => q.id === questionId);
        if (question) {
          question.selected = false;
        }
      }
    });
  }

  navigateToAddQuestion(): void {
    this.router.navigate(['/test-question']);
  }

  get filteredQuestions(): QuestionWithSelection[] {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return this.allQuestions;
    }

    const query = this.searchQuery.toLowerCase().trim();
    return this.allQuestions.filter(q => 
      q.text.toLowerCase().includes(query)
    );
  }

  getCorrectAnswer(question: Question): string {
    if (!question.answers || question.answers.length === 0) {
      return 'لا توجد إجابة محددة';
    }

    const correctAnswer = question.answers.find(a => a.isCorrect);
    return correctAnswer ? correctAnswer.text : 'لا توجد إجابة صحيحة';
  }
}