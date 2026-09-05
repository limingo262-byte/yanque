import { Button, Form, Input, Modal, Select, Space, Spin, Table, Tag } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { courseApi, studentLearningPlanApi } from '../api/system';
import type { CourseItem, StudentLearningCalendarItem, StudentLearningPlanItem, StudentLearningPlanPageParams } from '../types/system';

const statusOptions = [
  { label: '生效', value: 'ACTIVE' },
  { label: '取消', value: 'CANCELED' },
];

const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

const formatDate = (value?: string) => {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 10);
};

const buildCalendarCells = (year: number, month: number) => {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const startOffset = (firstDay.day() + 6) % 7;
  const startDate = firstDay.subtract(startOffset, 'day');
  return Array.from({ length: 42 }, (_, index) => {
    const date = startDate.add(index, 'day');
    return {
      date,
      key: date.format('YYYY-MM-DD'),
      inMonth: date.month() + 1 === month,
    };
  });
};

const getYearOptions = (rows: StudentLearningCalendarItem[]) => {
  const years = Array.from(new Set(rows.map((item) => dayjs(formatDate(item.studyDate)).year()))).sort((a, b) => a - b);
  const currentYear = dayjs().year();
  return (years.length ? years : [currentYear]).map((year) => ({ label: `${year}年`, value: year }));
};

const monthOptions = Array.from({ length: 12 }, (_, index) => ({ label: `${index + 1}月`, value: index + 1 }));

export default function StudentLearningPlansPage() {
  const [filterForm] = Form.useForm<Partial<StudentLearningPlanPageParams>>();
  const [rows, setRows] = useState<StudentLearningPlanItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [calendarRows, setCalendarRows] = useState<StudentLearningCalendarItem[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarYear, setCalendarYear] = useState(dayjs().year());
  const [calendarMonth, setCalendarMonth] = useState(dayjs().month() + 1);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const courseOptions = courses
    .filter((item) => item.teachingMode === 'ONLINE')
    .map((item) => ({ label: item.courseName, value: item.id }));

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await studentLearningPlanApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10);
    const loadCourses = async () => {
      const data = await courseApi.page({ pageNum: 1, pageSize: 1000 });
      setCourses(data.records);
    };
    void loadCourses();
  }, []);

  const openCalendar = async (record: StudentLearningPlanItem) => {
    setCalendarOpen(true);
    setCalendarLoading(true);
    try {
      const data = await studentLearningPlanApi.calendar(record.id);
      setCalendarRows(data);
      if (data.length) {
        const firstDate = dayjs(formatDate(data[0].studyDate));
        setCalendarYear(firstDate.year());
        setCalendarMonth(firstDate.month() + 1);
      }
    } finally {
      setCalendarLoading(false);
    }
  };

  const columns: TableColumnsType<StudentLearningPlanItem> = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: '学生姓名', dataIndex: 'studentName', width: 140, render: (value?: string) => value || '-' },
    { title: '手机号', dataIndex: 'studentPhone', width: 150, render: (value?: string) => value || '-' },
    { title: '课程', dataIndex: 'courseName', width: 180, render: (value?: string) => value || '-' },
    { title: '开始日期', dataIndex: 'startDate', width: 130, render: (value?: string) => formatDate(value) },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value?: string) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>{value === 'ACTIVE' ? '生效' : value || '-'}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (value?: string) => value?.replace('T', ' ').slice(0, 19) || '-' },
    {
      title: '操作',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => openCalendar(record)}>
          查看日历
        </Button>
      ),
    },
  ];

  const calendarMap = new Map(calendarRows.map((item) => [formatDate(item.studyDate), item]));
  const calendarCells = buildCalendarCells(calendarYear, calendarMonth);

  return (
    <div className="page-panel">
      <div className="table-toolbar">
        <Form form={filterForm} layout="inline" className="filter-row">
          <Form.Item name="studentName">
            <Input allowClear placeholder="学生姓名" style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="studentPhone">
            <Input allowClear placeholder="手机号" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="courseId">
            <Select allowClear showSearch optionFilterProp="label" placeholder="课程" options={courseOptions} style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="状态" options={statusOptions} style={{ width: 120 }} />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={pagination}
        scroll={{ x: 1080 }}
        onChange={(page: TablePaginationConfig) => load(page.current || 1, page.pageSize || 10)}
      />
      <Modal
        title="学习日历"
        open={calendarOpen}
        footer={null}
        onCancel={() => setCalendarOpen(false)}
        width={820}
        destroyOnClose
      >
        <Spin spinning={calendarLoading}>
          <div className="learning-calendar-panel">
            <div className="learning-calendar-toolbar">
              <Space>
                <Select value={calendarYear} options={getYearOptions(calendarRows)} onChange={setCalendarYear} style={{ width: 130 }} />
                <Select value={calendarMonth} options={monthOptions} onChange={setCalendarMonth} style={{ width: 110 }} />
              </Space>
            </div>
            <div className="learning-calendar-weekdays">
              {weekLabels.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
            <div className="learning-calendar-grid">
              {calendarCells.map((cell) => {
                const item = calendarMap.get(cell.key);
                const isToday = cell.key === dayjs().format('YYYY-MM-DD');
                return (
                  <div key={cell.key} className={`learning-calendar-cell${cell.inMonth ? '' : ' is-muted'}${isToday ? ' is-today' : ''}`}>
                    <div className="learning-calendar-day">{cell.date.date()}</div>
                    {item ? (
                      <div className="learning-calendar-content">
                        <div className="learning-calendar-stage">{item.stageName}</div>
                        <div className="learning-calendar-meta">
                          第{item.dayIndex}天
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </Spin>
      </Modal>
    </div>
  );
}
