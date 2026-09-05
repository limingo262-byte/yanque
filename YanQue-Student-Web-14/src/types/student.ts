export interface StudentLoginValues {
  phone: string;
  password: string;
}

export interface StudentInfo {
  id?: number;
  name?: string;
  phone?: string;
}

export interface StudentPendingPayOrder {
  id: number;
  orderNo: string;
  studentName: string;
  studentPhone: string;
  productId: number;
  productContent?: string;
  productAmount: number;
  discountAmount: number;
  payableAmount: number;
  orderStatus: string;
}

export interface CreateOrderNoResult {
  orderNo: string;
}

export interface CreatePaymentOrderValues {
  orderNo: string;
  studentPhone: string;
  studentName: string;
  productId: string;
  orderAmount: number;
  prepayOrderNo: string;
}

export interface CreatePaymentOrderResult {
  cashierUrl: string;
}

export interface PaymentReturnInfo {
  orderNo: string;
  studentName: string;
  studentPhone: string;
  productId: string;
  productContent?: string;
  orderAmount: number;
  status: string;
}

export interface CompleteProfileValues {
  orderNo: string;
  password: string;
  confirmPassword: string;
  education: string;
  gradeYear: number;
  school: string;
  major?: string;
}

export interface CompleteProfileResult {
  studentId: number;
  completed: boolean;
  token?: string;
  signSecret?: string;
  student?: StudentInfo;
}

export interface StudentLoginResult {
  needPay: boolean;
  needCompleteProfile?: boolean;
  paymentOrderNo?: string;
  token?: string;
  signSecret?: string;
  pendingPayToken?: string;
  pendingPaySignSecret?: string;
  student?: StudentInfo;
  pendingOrder?: StudentPendingPayOrder;
}

export interface PageResult<T> {
  total: number;
  pageNum: number;
  pageSize: number;
  records: T[];
}

export interface StudentHomeworkItem {
  id: number;
  title: string;
  homeworkDate: string;
  classContent: string;
  deadline: string;
  contentFileName: string;
  contentObjectKey: string;
  answerVisible: boolean;
  answerFileName?: string;
  answerObjectKey?: string;
  submitted: boolean;
  submissionFileName?: string;
  submitTime?: string;
  lateSubmitted?: boolean;
  score?: number;
  teacherRemark?: string;
}

export interface StudentHomeworkDownloadUrl {
  fileName: string;
  downloadUrl: string;
  expires: number;
}

export interface StudentHomeworkSubmitValues {
  objectKey: string;
  fileName: string;
}

export interface StudentHomeworkSubmitResult {
  id: number;
  homeworkId: number;
  contentFileName: string;
  submitTime: string;
  lateSubmitted: boolean;
}

export interface StudentExamItem {
  id: number;
  paperId: number;
  paperName?: string;
  classId: number;
  classPeriod?: string;
  courseId?: number;
  stageName?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  invigilatorUserId?: number;
  invigilatorName?: string;
  totalScore?: number;
  recordId?: number;
  recordStatus?: string;
  gradingStatus?: 'PENDING' | 'GRADING' | 'COMPLETED';
  recordStartTime?: string;
  deadlineTime?: string;
  submitTime?: string;
  score?: number;
  examStatus: 'NOT_STARTED' | 'AVAILABLE' | 'IN_PROGRESS' | 'SUBMITTED' | 'TIMEOUT' | 'ENDED';
  examStatusText: string;
  canStart: boolean;
}

export interface StudentExamStartResult {
  recordId: number;
  examId: number;
  paperId: number;
  startTime: string;
  deadlineTime: string;
  status: string;
}

export interface StudentExamPaperOption {
  id: number;
  questionId: number;
  optionKey: string;
  optionContent: string;
}

export interface StudentExamPaperQuestion {
  id: number;
  questionId: number;
  questionContent: string;
  questionType: string;
  difficulty: string;
  questionScore: number;
  options: StudentExamPaperOption[];
}

export interface StudentExamPaper {
  recordId: number;
  examId: number;
  paperId: number;
  paperName: string;
  classId: number;
  classPeriod?: string;
  courseId?: number;
  stageName?: string;
  totalScore: number;
  startTime: string;
  deadlineTime: string;
  recordStatus: string;
  gradingStatus?: 'PENDING' | 'GRADING' | 'COMPLETED';
  questions: StudentExamPaperQuestion[];
}

export interface StudentExamAnswerValues {
  questionId: number;
  answerContent?: string;
}

export interface StudentExamSubmitValues {
  answers: StudentExamAnswerValues[];
}

export interface StudentExamSubmitResult {
  recordId: number;
  examId: number;
  status: string;
  gradingStatus: 'PENDING' | 'GRADING' | 'COMPLETED';
  submitTime: string;
  score?: number;
}

export interface StudentExamSubmissionQuestion {
  id: number;
  questionId: number;
  questionContent: string;
  questionType: string;
  questionScore: number;
  answerContent?: string;
  correctAnswer?: string;
  analysisContent?: string;
  correct?: boolean;
  score?: number;
  options: StudentExamPaperOption[];
}

export interface StudentExamSubmission {
  recordId: number;
  examId: number;
  paperId: number;
  paperName: string;
  classPeriod?: string;
  stageName?: string;
  totalScore: number;
  score?: number;
  recordStatus: string;
  gradingStatus?: 'PENDING' | 'GRADING' | 'COMPLETED';
  answerVisible?: boolean;
  submitTime?: string;
  questions: StudentExamSubmissionQuestion[];
}

export interface UploadPresignResult {
  uploadUrl: string;
  objectKey: string;
  expires: number;
  headers?: Record<string, string>;
}

export interface StudentLearningPlanCurrent {
  hasPlan: boolean;
  id?: number;
  courseName?: string;
  startDate?: string;
  endDate?: string;
  totalDays: number;
  currentDayIndex?: number;
  todayStageName?: string;
  status: string;
}

/** AI 问答会话列表项。 */
export interface AiChatSession {
  /** 会话 ID，发送消息和查询历史都需要带它。 */
  id: number;

  /** 会话标题，默认来自第一条问题。 */
  title: string;

  /** 最近更新时间，用于左侧列表排序展示。 */
  updatedAt: string;
}

/** AI 问答消息。 */
export interface AiChatMessage {
  /** 历史消息有 id，前端正在流式生成的临时消息没有 id。 */
  id?: number;

  /** 所属会话 ID；临时消息可以为空。 */
  sessionId?: number;

  /** user 是学生消息，assistant 是 AI 消息。 */
  role: 'user' | 'assistant';

  /** 消息正文。 */
  content: string;

  /** AI 使用的模型；学生消息没有这个值。 */
  model?: string;

  /** AI 回答消耗的 token 数。 */
  tokens?: number;

  /** 消息创建时间。 */
  createdAt?: string;
}

export interface StudentLearningCalendarItem {
  studyDate: string;
  stageName: string;
  dayIndex: number;
  status: string;
}
