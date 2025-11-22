// Course Interfaces
export interface CourseDTO {
  id?: string;
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  price: number;
  typeStatus: string;
  instructorId: string;
  imageUrl?: string;
  contentType?: string;
  courseDetails?: string;
}

export interface CourseResponse {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  price: number;
  typeStatus: string;
  instructorId?: string;
  imageUrl?: string;
  contentType?: string;
}

// Module Interfaces
export interface ModuleDTO {
  id?: string;
  title: string;
  description: string;
  courseId: string;
}

export interface ModuleResponse {
  id: string;
  title: string;
  description: string;
  courseId: string;
}

// Lecture Interfaces
export interface LectureDTO {
  id?: string;
  title: string;
  scheduledAt: string; // ISO string
  moduleId: string;
  courseId: string;
}

export interface LectureResponse {
  id: string;
  title: string;
  scheduledAt: string;
  moduleId: string;
  courseId: string;
}

// Answer Interfaces
export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  questionId?: string;
}

export interface Question {
  id: string;
  text: string;
  point: number;
  imageUrl?: string;
  answers: Answer[];
  expanded?: boolean;
}

export interface CreateAnswerDTO {
  questionId: string;
  text: string;
  isCorrect: boolean;
}

// Student Interfaces
export interface StudentResponse {
  isSuccess: boolean;
  isError: boolean;
  errors: any[];
  value: Student[];
  topError: {
    type: number;
  };
}

export interface Student {
  id: string;
  userId: string;
  gender: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  phoneNumber: string;
}

export interface StudentForTable {
  id: string;
  name: string;
  avatar: string;
  course: string;
  joinDate: string;
  phone: string;
  status: 'قيد المراجعة' | 'مقبول' | 'مرفوض';
  gender: string;
  email: string;
}

export interface CreateStudentDTO {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  password: string;
  userName: string;
}
export interface InstructorDTO {
  id?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  phoneNumber: string;
  password?: string;
  email?: string;
  title?: string;
  description?: string;
}
export interface InstructorResponse {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  phoneNumber: string;
  title?: string;
  description?: string;
  courses: string[];
}

export interface Instructor {
  id: string;
  name: string;
  phone: string;
  gender: string;
  courses: string;
  joinDate: string;
}
export interface Enrollment {
  id?: string;
  studentId: string;
  courseId: string;
  enrollmentDate: string;
}

export interface CreateEnrollmentDTO {
  studentId: string;
  courseId: string;
  enrollmentDate: string;
}

export interface EnrollmentResponse {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: string;
  student?: Student;
  course?: CourseResponse;
}

// تحديث واجهة Student لتشمل الدورات
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth?: string;
  enrollments?: EnrollmentResponse[];
}

// تحديث واجهة StudentForTable
export interface StudentForTable {
  id: string;
  name: string;
  avatar: string;
  course: string; // سيكون "- اسم الدورة" أو فارغ
  joinDate: string;
  phone: string;
  status: 'قيد المراجعة' | 'مقبول' | 'مرفوض';
  gender: string;
  email: string;
  enrollmentDate?: string;
}