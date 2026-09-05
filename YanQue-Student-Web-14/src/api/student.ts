import http from './http';
import type {
  CompleteProfileResult,
  CompleteProfileValues,
  CreateOrderNoResult,
  CreatePaymentOrderResult,
  CreatePaymentOrderValues,
  PaymentReturnInfo,
  PageResult,
  StudentHomeworkDownloadUrl,
  StudentExamItem,
  StudentExamPaper,
  StudentExamStartResult,
  StudentExamSubmission,
  StudentExamSubmitResult,
  StudentExamSubmitValues,
  StudentHomeworkItem,
  StudentHomeworkSubmitResult,
  StudentHomeworkSubmitValues,
  StudentLearningCalendarItem,
  StudentLearningPlanCurrent,
  StudentLoginResult,
  StudentLoginValues,
  UploadPresignResult,
} from '../types/student';

export const studentApi = {
  login(data: StudentLoginValues) {
    return http.post<never, StudentLoginResult>('/student/login', data);
  },
  createOrderNo() {
    return http.post<never, CreateOrderNoResult>('/student/pending/order/createOrderNo');
  },
  createPaymentOrder(data: CreatePaymentOrderValues) {
    return http.post<never, CreatePaymentOrderResult>('/student/pending/order/createPaymentOrder', data);
  },
  paymentReturnInfo(orderNo: string) {
    return http.get<never, PaymentReturnInfo>('/student/pending/order/paymentReturnInfo', { params: { orderNo } });
  },
  completeProfile(data: CompleteProfileValues) {
    return http.post<never, CompleteProfileResult>('/student/pending/profile/completeProfile', data);
  },
  homeworks(pageNum = 1, pageSize = 10) {
    return http.get<never, PageResult<StudentHomeworkItem>>('/student/homeworks', { params: { pageNum, pageSize } });
  },
  homeworkDownloadUrl(id: number, type: 'CONTENT' | 'ANSWER') {
    return http.get<never, StudentHomeworkDownloadUrl>(`/student/homeworks/${id}/download-url`, { params: { type } });
  },
  homeworkSubmit(id: number, data: StudentHomeworkSubmitValues) {
    return http.post<never, StudentHomeworkSubmitResult>(`/student/homeworks/${id}/submissions`, data);
  },
  homeworkSubmissionDownloadUrl(id: number) {
    return http.get<never, StudentHomeworkDownloadUrl>(`/student/homeworks/${id}/submissions/download-url`);
  },
  exams(pageNum = 1, pageSize = 10) {
    return http.get<never, PageResult<StudentExamItem>>('/student/exams', { params: { pageNum, pageSize } });
  },
  examStart(id: number) {
    return http.post<never, StudentExamStartResult>(`/student/exams/${id}/start`);
  },
  examPaper(recordId: number) {
    return http.get<never, StudentExamPaper>(`/student/exams/records/${recordId}/paper`);
  },
  examSubmit(recordId: number, data: StudentExamSubmitValues) {
    return http.post<never, StudentExamSubmitResult>(`/student/exams/records/${recordId}/submit`, data);
  },
  examSubmission(recordId: number) {
    return http.get<never, StudentExamSubmission>(`/student/exams/records/${recordId}/submission`);
  },
  presignUpload(objectKey: string) {
    return http.post<never, UploadPresignResult>('/student/upload/presign-upload', { objectKey });
  },
  learningPlanCurrent() {
    return http.get<never, StudentLearningPlanCurrent>('/student/learning-plan/current');
  },
  learningPlanCalendar() {
    return http.get<never, StudentLearningCalendarItem[]>('/student/learning-plan/current/calendar');
  },
};
