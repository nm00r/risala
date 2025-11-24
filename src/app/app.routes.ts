import { Routes } from '@angular/router';
import { RequestsComponent } from './component/requests/requests.component';
import { DashboardPageComponent } from './component/dashboard-page/dashboard-page.component';
import { CoursesComponent } from './component/courses/courses.component';
import { TestsComponent } from './component/quiz/tests/tests.component';
import { CreateTestsComponent } from './component/quiz/create-tests/create-tests.component';
import { TestQuestionComponent } from './component/quiz/test-question/test-question.component';
import { AnswerComponent } from './component/quiz/answer/answer.component';
import { CreateCourseComponent } from './component/courses/create-course/create-course.component';
import { InstructorsComponent } from './component/instructors/instructors.component';
import { authGuard } from './core/services/auth.guard';
import { LoginComponent } from './component/login/login.component';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: '', 
    component: DashboardPageComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'requests', 
    component: RequestsComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'courses', 
    component: CoursesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'courses/create',
    component: CreateCourseComponent,
    canActivate: [authGuard]
  },
  {
    path: 'courses/edit/:id',
    component: CreateCourseComponent,
    canActivate: [authGuard]
  },
  {
    path: 'teachers',
    component: InstructorsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'teachers/view/:id',
    component: InstructorsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tests',
    component: TestsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tests/create',
    component: CreateTestsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tests/edit/:id',
    component: CreateTestsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tests/questions/:id',
    component: TestQuestionComponent,
    canActivate: [authGuard]
  },
  {
    path: 'questions',
    component: TestQuestionComponent,
    canActivate: [authGuard]
  },
  {
    path: 'answers',
    component: AnswerComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];