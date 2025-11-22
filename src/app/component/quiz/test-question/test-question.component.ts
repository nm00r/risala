import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Question } from '../../../core/interfaces/courses';
import { AllApiService } from '../../../core/services/all-api.service';

@Component({
  selector: 'app-test-question',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-question.component.html',
  styleUrl: './test-question.component.scss'
})
export class TestQuestionComponent {
 questions: Question[] = [];
  showAddQuestionForm = false;
  selectedFile: File | null = null;
  
  newQuestion = {
    text: '',
    points: 0
  };

  // إضافة إجابة جديدة
  showAddAnswerForm: { [key: string]: boolean } = {};
  newAnswer: { [key: string]: { text: string; isCorrect: boolean } } = {};

  constructor(private apiService: AllApiService) {}

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.apiService.getAllQuestions().subscribe({
      next: (data) => {
        this.questions = data.map(q => ({ ...q, expanded: false }));
        console.log('تم تحميل الأسئلة:', this.questions);
        
        // تحميل الإجابات لكل سؤال
        this.questions.forEach(question => {
          this.loadAnswersForQuestion(question.id);
        });
      },
      error: (err) => {
        console.error('خطأ في تحميل الأسئلة:', err);
      }
    });
  }

  toggleQuestionDetails(questionId: string) {
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      question.expanded = !question.expanded;
      
      // تحديث الإجابات عند فتح السؤال (للتأكد من أحدث البيانات)
      if (question.expanded) {
        this.loadAnswersForQuestion(questionId);
      }
    }
  }

  loadAnswersForQuestion(questionId: string) {
    this.apiService.getAnswersByQuestion(questionId).subscribe({
      next: (answers) => {
        const question = this.questions.find(q => q.id === questionId);
        if (question) {
          question.answers = answers;
          console.log(`السؤال: ${question.text} - عدد الإجابات: ${answers.length}`, answers);
        }
      },
      error: (err) => {
        console.error('خطأ في تحميل الإجابات للسؤال:', questionId, err);
        // في حالة عدم وجود إجابات، نضع مصفوفة فارغة
        const question = this.questions.find(q => q.id === questionId);
        if (question) {
          question.answers = [];
        }
      }
    });
  }

  toggleAddQuestionForm() {
    this.showAddQuestionForm = !this.showAddQuestionForm;
    if (!this.showAddQuestionForm) {
      this.resetQuestionForm();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('تم اختيار الملف:', file.name);
    }
  }

  addQuestion() {
    if (!this.newQuestion.text || this.newQuestion.points <= 0) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const formData = new FormData();
    formData.append('Text', this.newQuestion.text);
    formData.append('Points', this.newQuestion.points.toString());
    
    if (this.selectedFile) {
      formData.append('Image', this.selectedFile);
    }

    this.apiService.createQuestion(formData).subscribe({
      next: (response) => {
        console.log('تم إضافة السؤال بنجاح:', response);
        this.loadQuestions();
        this.resetQuestionForm();
        this.showAddQuestionForm = false;
        alert('تم إضافة السؤال بنجاح!');
      },
      error: (err) => {
        console.error('خطأ في إضافة السؤال:', err);
        alert('فشل إضافة السؤال');
      }
    });
  }

  deleteQuestion(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟ سيتم حذف جميع الإجابات المرتبطة به.')) {
      this.apiService.deleteQuestion(id).subscribe({
        next: () => {
          console.log('تم حذف السؤال');
          this.loadQuestions();
          alert('تم حذف السؤال بنجاح!');
        },
        error: (err) => {
          console.error('خطأ في حذف السؤال:', err);
          alert('فشل حذف السؤال');
        }
      });
    }
  }

  resetQuestionForm() {
    this.newQuestion = {
      text: '',
      points: 0
    };
    this.selectedFile = null;
  }

  // ==================== إدارة الإجابات ====================

  toggleAddAnswerForm(questionId: string) {
    this.showAddAnswerForm[questionId] = !this.showAddAnswerForm[questionId];
    if (this.showAddAnswerForm[questionId]) {
      this.newAnswer[questionId] = { text: '', isCorrect: false };
    }
  }

  addAnswer(questionId: string) {
    const answerData = this.newAnswer[questionId];
    if (!answerData || !answerData.text.trim()) {
      alert('يرجى إدخال نص الإجابة');
      return;
    }

    const createAnswerDTO = {
      text: answerData.text,
      isCorrect: answerData.isCorrect,
      questionId: questionId
    };

    this.apiService.createAnswer(createAnswerDTO).subscribe({
      next: (response) => {
        console.log('تم إضافة الإجابة بنجاح:', response);
        this.loadAnswersForQuestion(questionId);
        this.showAddAnswerForm[questionId] = false;
        alert('تم إضافة الإجابة بنجاح!');
      },
      error: (err) => {
        console.error('خطأ في إضافة الإجابة:', err);
        alert('فشل إضافة الإجابة');
      }
    });
  }

  deleteAnswer(answerId: string, questionId: string) {
    if (confirm('هل أنت متأكد من حذف هذه الإجابة؟')) {
      this.apiService.deleteAnswer(answerId).subscribe({
        next: () => {
          console.log('تم حذف الإجابة');
          this.loadAnswersForQuestion(questionId);
          alert('تم حذف الإجابة بنجاح!');
        },
        error: (err) => {
          console.error('خطأ في حذف الإجابة:', err);
          alert('فشل حذف الإجابة');
        }
      });
    }
  }
}
