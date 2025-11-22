import { Component } from '@angular/core';
import { Answer, Question } from '../../../core/interfaces/courses';
import { AllApiService } from '../../../core/services/all-api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-answer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './answer.component.html',
  styleUrl: './answer.component.scss'
})
export class AnswerComponent {
answers: Answer[] = [];
  questions: Question[] = [];
  showAddForm: { [key: string]: boolean } = {};
  selectedQuestionFilter: string = '';

  newAnswer: { [key: string]: { text: string; isCorrect: boolean } } = {};

  constructor(private apiService: AllApiService) {}

  ngOnInit() {
    this.loadQuestions();
    this.loadAllAnswers();
  }

  loadAllAnswers() {
    this.apiService.getAllAnswers().subscribe({
      next: (data) => {
        this.answers = data;
        console.log('جميع الإجابات:', this.answers);
      },
      error: (err) => {
        console.error('خطأ في تحميل الإجابات:', err);
      }
    });
  }

  loadQuestions() {
    this.apiService.getAllQuestions().subscribe({
      next: (data) => {
        this.questions = data;
        console.log('جميع الأسئلة:', this.questions);
      },
      error: (err) => {
        console.error('خطأ في تحميل الأسئلة:', err);
      }
    });
  }

  getFilteredQuestions(): Question[] {
    if (this.selectedQuestionFilter) {
      return this.questions.filter(q => q.id === this.selectedQuestionFilter);
    }
    return this.questions;
  }

  filterByQuestion() {
    // يتم التصفية تلقائياً من خلال getFilteredQuestions
  }

  getAnswersForQuestion(questionId: string): Answer[] {
    return this.answers.filter(a => a.questionId === questionId);
  }

  getCorrectAnswersCount(questionId: string): number {
    return this.answers.filter(a => a.questionId === questionId && a.isCorrect).length;
  }

  getWrongAnswersCount(questionId: string): number {
    return this.answers.filter(a => a.questionId === questionId && !a.isCorrect).length;
  }

  toggleAddAnswerForm(questionId: string) {
    this.showAddForm[questionId] = !this.showAddForm[questionId];
    
    if (this.showAddForm[questionId]) {
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
        this.loadAllAnswers();
        this.showAddForm[questionId] = false;
        this.newAnswer[questionId] = { text: '', isCorrect: false };
      },
      error: (err) => {
        console.error('خطأ في إضافة الإجابة:', err);
        alert('فشل إضافة الإجابة');
      }
    });
  }

  deleteAnswer(answerId: string) {
    if (confirm('هل أنت متأكد من حذف هذه الإجابة؟')) {
      this.apiService.deleteAnswer(answerId).subscribe({
        next: () => {
          console.log('تم حذف الإجابة');
          this.loadAllAnswers();
        },
        error: (err) => {
          console.error('خطأ في حذف الإجابة:', err);
          alert('فشل حذف الإجابة');
        }
      });
    }
  }

  getTotalAnswersCount(): number {
    return this.answers.length;
  }
}
