import { Button, DatePicker, Empty, Form, Input, Modal, Select, Segmented, Space, Spin, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { clazzApi, userApi } from '../api/system';
import type { ClassScheduleDateDetail, ClassScheduleItem, ClassScheduleType, ClassStageInfoItem, ClazzItem, UserItem } from '../types/system';

type ViewMode = 'month' | 'year';

interface CalendarCell {
  date: Date;
  dateKey: string;
  day: number;
  currentMonth: boolean;
}

interface StageTeacherItem {
  stageName: string;
  stageNumber: number;
  freeTeacherName: Record<string, string>;
  teacherId?: number;
}

interface AddCourseFormValues {
  courseContent: string;
  scheduleDate: { format: (template: string) => string };
  teacherId: number;
}

const weekTitles = ['一', '二', '三', '四', '五', '六', '日'];

const scheduleTypeMeta: Record<ClassScheduleType, { label: string; className: string }> = {
  CLASS: { label: '上课', className: 'class' },
  SELF_STUDY: { label: '自习', className: 'self-study' },
  HOLIDAY: { label: '放假', className: 'holiday' },
  REST: { label: '休息', className: 'rest' },
};

const pad = (value: number) => String(value).padStart(2, '0');

const formatDateKey = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseDateKey = (value: string) => value.slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getMondayIndex = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

const buildMonthCells = (year: number, month: number): CalendarCell[] => {
  const firstDate = new Date(year, month - 1, 1);
  const startDate = addDays(firstDate, -getMondayIndex(firstDate));
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(startDate, index);
    return {
      date,
      dateKey: formatDateKey(date),
      day: date.getDate(),
      currentMonth: date.getMonth() === month - 1,
    };
  });
};

const getClassLabel = (item: ClazzItem) => {
  const campus = item.campusName || `校区${item.campusId}`;
  return `${item.classPeriod} · ${campus}`;
};

export default function ClassSchedulesPage() {
  const [addCourseForm] = Form.useForm<AddCourseFormValues>();
  const today = new Date();
  const [classes, setClasses] = useState<ClazzItem[]>([]);
  const [classId, setClassId] = useState<number>();
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [teachers, setTeachers] = useState<UserItem[]>([]);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [stageTeachers, setStageTeachers] = useState<StageTeacherItem[]>([]);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false);
  const [dateDetail, setDateDetail] = useState<ClassScheduleDateDetail>();
  const [dateDetailOpen, setDateDetailOpen] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingTeacherModal, setLoadingTeacherModal] = useState(false);
  const [loadingDateDetail, setLoadingDateDetail] = useState(false);
  const [savingTeachers, setSavingTeachers] = useState(false);
  const [savingAddCourse, setSavingAddCourse] = useState(false);

  const classOptions = useMemo(
    () => classes.map((item) => ({ label: getClassLabel(item), value: item.id })),
    [classes],
  );

  const yearOptions = useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from({ length: 7 }, (_, index) => {
      const value = currentYear - 3 + index;
      return { label: `${value}年`, value };
    });
  }, []);

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => ({ label: `${index + 1}月`, value: index + 1 })),
    [],
  );

  const teacherOptions = useMemo(
    () => teachers.map((item) => ({ label: `${item.realName || item.nickname || item.username} (${item.id})`, value: item.id })),
    [teachers],
  );

  const selectedClass = useMemo(() => classes.find((item) => item.id === classId), [classes, classId]);

  const scheduleMap = useMemo(() => {
    const result: Record<string, ClassScheduleItem> = {};
    schedules.forEach((item) => {
      result[parseDateKey(item.scheduleDate)] = item;
    });
    return result;
  }, [schedules]);

  const monthCells = useMemo(() => buildMonthCells(year, month), [year, month]);
  const yearMonths = useMemo(
    () => Array.from({ length: 12 }, (_, index) => ({ month: index + 1, cells: buildMonthCells(year, index + 1) })),
    [year],
  );

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await clazzApi.page({ pageNum: 1, pageSize: 1000 });
      setClasses(data.records);
      if (data.records.length > 0) {
        setClassId((current) => current || data.records[0].id);
      }
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadSchedules = async (targetClassId: number) => {
    setLoadingSchedules(true);
    try {
      const dateRange =
        viewMode === 'year'
          ? { startDate: `${year}-01-01`, endDate: `${year}-12-31` }
          : {
              startDate: monthCells[0].dateKey,
              endDate: monthCells[monthCells.length - 1].dateKey,
            };
      const data = await clazzApi.listSchedules(targetClassId, dateRange);
      setSchedules(data);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const data = await userApi.page({ pageNum: 1, pageSize: 1000, roleCode: 'TEACHER' });
      setTeachers(data.records);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const openTeacherModal = async () => {
    if (!selectedClass) {
      message.warning('请选择班级');
      return;
    }
    setTeacherModalOpen(true);
    setLoadingTeacherModal(true);
    try {
      const data = await clazzApi.classStageInfo(selectedClass.id);
      setStageTeachers(data.map((item: ClassStageInfoItem) => ({ ...item })));
    } finally {
      setLoadingTeacherModal(false);
    }
  };

  const changeStageTeacher = (stageName: string, teacherId?: number) => {
    setStageTeachers((items) => items.map((item) => (item.stageName === stageName ? { ...item, teacherId } : item)));
  };

  const saveStageTeachers = async () => {
    if (!selectedClass) {
      message.warning('请选择班级');
      return;
    }
    const unselected = stageTeachers.find((item) => !item.teacherId);
    if (unselected) {
      message.warning(`请选择${unselected.stageName}阶段老师`);
      return;
    }
    setSavingTeachers(true);
    try {
      const result = await clazzApi.assignScheduleTeachers(selectedClass.id, {
        stages: stageTeachers.map((item) => ({
          stageName: item.stageName,
          teacherId: item.teacherId as number,
        })),
      });
      message.success(`老师已分配，更新 ${result.updateCount} 条课表`);
      setTeacherModalOpen(false);
      void loadSchedules(selectedClass.id);
    } finally {
      setSavingTeachers(false);
    }
  };

  const openDateDetail = async (dateKey: string, item?: ClassScheduleItem) => {
    if (!classId) {
      message.warning('请选择班级');
      return;
    }
    if (!item) {
      message.info('当天暂无课表');
      return;
    }
    setDateDetailOpen(true);
    setDateDetail(undefined);
    setLoadingDateDetail(true);
    try {
      const data = await clazzApi.dateDetail(classId, dateKey);
      setDateDetail(data);
    } finally {
      setLoadingDateDetail(false);
    }
  };

  const openAddCourseModal = async () => {
    if (!selectedClass) {
      message.warning('请选择班级');
      return;
    }
    addCourseForm.resetFields();
    setAddCourseModalOpen(true);
    void loadTeachers();
  };

  const saveAddCourse = async () => {
    if (!selectedClass) {
      message.warning('请选择班级');
      return;
    }
    const values = await addCourseForm.validateFields();
    setSavingAddCourse(true);
    try {
      await clazzApi.addScheduleCourse(selectedClass.id, {
        courseContent: values.courseContent,
        scheduleDate: values.scheduleDate.format('YYYY-MM-DD'),
        teacherId: values.teacherId,
      });
      message.success('课程已新增');
      setAddCourseModalOpen(false);
      void loadSchedules(selectedClass.id);
    } finally {
      setSavingAddCourse(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, []);

  useEffect(() => {
    if (!classId) {
      setSchedules([]);
      return;
    }
    void loadSchedules(classId);
  }, [classId, year, month, viewMode]);

  const renderSchedule = (item?: ClassScheduleItem) => {
    if (!item) {
      return null;
    }
    const meta = scheduleTypeMeta[item.classType];
    const showContent = Boolean(item.courseContent && item.courseContent !== meta.label);
    return (
      <div className="schedule-day-body">
        <span className={`schedule-badge schedule-badge-${meta.className}`}>{meta.label}</span>
        {showContent ? <Typography.Text className="schedule-course-content">{item.courseContent}</Typography.Text> : null}
      </div>
    );
  };

  return (
    <div className="schedule-page">
      <div className="schedule-page-header">
        <Space size={20} wrap>
          <Typography.Title level={2}>课表管理</Typography.Title>
          <span className="schedule-select-label">选择班级：</span>
          <Select
            showSearch
            value={classId}
            loading={loadingClasses}
            options={classOptions}
            optionFilterProp="label"
            className="schedule-class-select"
            placeholder="请选择班级"
            onChange={setClassId}
          />
          <Button type="primary" onClick={openTeacherModal}>
            分配老师
          </Button>
          <Button onClick={openAddCourseModal}>新增课程</Button>
        </Space>
      </div>

      <div className="schedule-calendar-card">
        <div className="schedule-calendar-toolbar">
          <Space wrap>
            <Select value={year} options={yearOptions} className="schedule-year-select" onChange={setYear} />
            <Select value={month} options={monthOptions} className="schedule-month-select" disabled={viewMode === 'year'} onChange={setMonth} />
            <Segmented
              value={viewMode}
              options={[
                { label: '月', value: 'month' },
                { label: '年', value: 'year' },
              ]}
              onChange={(value) => setViewMode(value as ViewMode)}
            />
          </Space>
        </div>

        <Spin spinning={loadingSchedules}>
          {classId ? (
            viewMode === 'month' ? (
              <div className="schedule-calendar">
                <div className="schedule-week-row">
                  {weekTitles.map((item) => (
                    <div className="schedule-week-cell" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="schedule-month-grid">
                  {monthCells.map((cell) => {
                    const item = scheduleMap[cell.dateKey];
                    const isToday = cell.dateKey === formatDateKey(today);
                    return (
                      <div
                        className={[
                          'schedule-day-cell',
                          cell.currentMonth ? '' : 'schedule-day-cell-muted',
                          isToday ? 'schedule-day-cell-today' : '',
                          item ? 'schedule-day-cell-clickable' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        key={cell.dateKey}
                        onClick={() => openDateDetail(cell.dateKey, item)}
                      >
                        <div className="schedule-day-number">{cell.day}</div>
                        {renderSchedule(item)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="schedule-year-grid">
                {yearMonths.map((item) => (
                  <div className="schedule-year-month" key={item.month}>
                    <div className="schedule-year-month-title">{item.month}月</div>
                    <div className="schedule-year-week-row">
                      {weekTitles.map((week) => (
                        <span key={week}>{week}</span>
                      ))}
                    </div>
                    <div className="schedule-year-days">
                      {item.cells.map((cell) => {
                        const schedule = scheduleMap[cell.dateKey];
                        const meta = schedule ? scheduleTypeMeta[schedule.classType] : undefined;
                        return (
                          <div
                            className={[
                              'schedule-year-day',
                              cell.currentMonth ? '' : 'schedule-year-day-muted',
                              meta ? `schedule-year-day-${meta.className}` : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            key={cell.dateKey}
                            title={schedule?.courseContent || meta?.label}
                          >
                            {cell.day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <Empty description="请选择班级" />
          )}
        </Spin>
      </div>

      <Modal
        title="分配老师"
        open={teacherModalOpen}
        width={620}
        onOk={saveStageTeachers}
        confirmLoading={savingTeachers}
        onCancel={() => setTeacherModalOpen(false)}
        destroyOnHidden
      >
        <Spin spinning={loadingTeacherModal}>
          <Typography.Paragraph className="teacher-modal-desc">
            根据当前班级关联课程展示阶段，并按课程详情统计每个阶段的天数。
          </Typography.Paragraph>
          {stageTeachers.length > 0 ? (
            <div className="teacher-stage-list">
              {stageTeachers.map((item) => (
                <div className="teacher-stage-item" key={item.stageName}>
                  <div className="teacher-stage-title">
                    {item.stageName}（{item.stageNumber}天）
                  </div>
                  <Select
                    allowClear
                    showSearch
                    value={item.teacherId}
                    placeholder="请选择老师"
                    options={Object.entries(item.freeTeacherName || {}).map(([id, name]) => ({
                      label: `${name || '未命名'} (${id})`,
                      value: Number(id),
                    }))}
                    optionFilterProp="label"
                    className="teacher-stage-select"
                    onChange={(value) => changeStageTeacher(item.stageName, value)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Empty description="暂无课程阶段" />
          )}
        </Spin>
      </Modal>

      <Modal
        title={dateDetail ? `${dateDetail.scheduleDate} 课程详情` : '课程详情'}
        open={dateDetailOpen}
        width={460}
        footer={null}
        onCancel={() => setDateDetailOpen(false)}
        destroyOnHidden
      >
        <Spin spinning={loadingDateDetail}>
          {dateDetail ? (
            <div className="schedule-detail-card">
              <div className="schedule-detail-head">
                <span className={`schedule-badge schedule-badge-${scheduleTypeMeta[dateDetail.classType].className}`}>
                  {scheduleTypeMeta[dateDetail.classType].label}
                </span>
                <span className="schedule-detail-date">{dateDetail.scheduleDate}</span>
              </div>
              <div className="schedule-detail-grid">
                <div>
                  <span>阶段</span>
                  <strong>{dateDetail.stageName || '-'}</strong>
                </div>
                <div>
                  <span>第几天</span>
                  <strong>{dateDetail.dayNumber ? `第${dateDetail.dayNumber}天` : '-'}</strong>
                </div>
                <div>
                  <span>老师</span>
                  <strong>{dateDetail.teacherName || '-'}</strong>
                </div>
                <div>
                  <span>课表ID</span>
                  <strong>{dateDetail.id}</strong>
                </div>
              </div>
              <div className="schedule-detail-content">
                <span>课程内容</span>
                <p>{dateDetail.courseContent || '-'}</p>
              </div>
            </div>
          ) : (
            <Empty description="暂无详情" />
          )}
        </Spin>
      </Modal>

      <Modal
        title="新增课程"
        open={addCourseModalOpen}
        width={520}
        onOk={saveAddCourse}
        confirmLoading={savingAddCourse}
        onCancel={() => setAddCourseModalOpen(false)}
        destroyOnHidden
      >
        <Form form={addCourseForm} layout="vertical" className="schedule-add-course-form">
          <Form.Item name="scheduleDate" label="上课日期" rules={[{ required: true, message: '请选择上课日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="teacherId" label="老师" rules={[{ required: true, message: '请选择老师' }]}>
            <Select
              showSearch
              loading={loadingTeachers}
              options={teacherOptions}
              optionFilterProp="label"
              placeholder="请选择老师"
            />
          </Form.Item>
          <Form.Item name="courseContent" label="课程内容" rules={[{ required: true, message: '请输入课程内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入临时新增课程内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
