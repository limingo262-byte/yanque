import { DatePicker, Empty, Spin, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { clazzApi, userApi } from '../api/system';
import type { TeacherScheduleDetail, TeacherScheduleItem, UserItem } from '../types/system';

interface DateRangeValue {
  format: (template: string) => string;
}

const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const pad = (value: number) => String(value).padStart(2, '0');

const formatDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateKey = (value: string) => value.slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startTime: formatDateKey(start),
    endTime: formatDateKey(end),
  };
};

const buildDateColumns = (startTime: string, endTime: string) => {
  const dates: Date[] = [];
  let cursor = new Date(`${startTime}T00:00:00`);
  const endDate = new Date(`${endTime}T00:00:00`);
  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return dates;
};

const buildTeacherSegments = (row: TeacherScheduleItem, dateColumns: Date[]) => {
  const detailMap = new Map<string, TeacherScheduleDetail>();
  row.teacherDetailList?.forEach((item) => {
    detailMap.set(parseDateKey(item.teacheringDate), item);
  });

  const segments: Array<{ startIndex: number; length: number; label: string; classId: number }> = [];
  dateColumns.forEach((date, index) => {
    const dateKey = formatDateKey(date);
    const detail = detailMap.get(dateKey);
    if (!detail) {
      return;
    }
    const last = segments[segments.length - 1];
    if (last && last.startIndex + last.length === index && last.classId === detail.classId && last.label === detail.classPeriod) {
      last.length += 1;
      return;
    }
    segments.push({
      startIndex: index,
      length: 1,
      label: detail.classPeriod,
      classId: detail.classId,
    });
  });
  return segments;
};

export default function TeacherSchedulesPage() {
  const [range, setRange] = useState(getMonthRange);
  const [rows, setRows] = useState<TeacherScheduleItem[]>([]);
  const [teachers, setTeachers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  const dateColumns = useMemo(() => buildDateColumns(range.startTime, range.endTime), [range]);
  const busyTeacherIds = useMemo(() => new Set(rows.map((item) => item.teacherId)), [rows]);
  const freeTeachers = useMemo(
    () => teachers.filter((item) => !busyTeacherIds.has(item.id)),
    [teachers, busyTeacherIds],
  );

  const load = async (nextRange = range) => {
    setLoading(true);
    try {
      const [scheduleData, teacherData] = await Promise.all([
        clazzApi.teacherDetail(nextRange),
        userApi.page({ pageNum: 1, pageSize: 1000, roleCode: 'TEACHER' }),
      ]);
      setRows(scheduleData);
      setTeachers(teacherData.records);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const changeRange = (values: null | [DateRangeValue | null, DateRangeValue | null]) => {
    if (!values || !values[0] || !values[1]) {
      return;
    }
    const startTime = values[0].format('YYYY-MM-DD');
    const endTime = values[1].format('YYYY-MM-DD');
    if (buildDateColumns(startTime, endTime).length > 45) {
      message.warning('时间范围最多选择45天');
      return;
    }
    const nextRange = { startTime, endTime };
    setRange(nextRange);
    void load(nextRange);
  };

  return (
    <div className="teacher-schedule-page">
      <div className="teacher-schedule-header">
        <div>
          <Typography.Title level={2}>老师课表</Typography.Title>
          <Typography.Text type="secondary">默认展示本月，仅显示有课老师；可按时间范围筛选。</Typography.Text>
        </div>
        <div className="teacher-schedule-range">
          <span>时间范围</span>
          <DatePicker.RangePicker onChange={(values) => changeRange(values as null | [DateRangeValue | null, DateRangeValue | null])} />
        </div>
      </div>

      <Spin spinning={loading}>
        <div className="teacher-schedule-layout">
          <div className="teacher-schedule-board">
            {rows.length > 0 ? (
              <div
                className="teacher-schedule-grid"
                style={{ gridTemplateColumns: `140px repeat(${dateColumns.length}, 92px)` }}
              >
                <div className="teacher-schedule-cell teacher-schedule-fixed teacher-schedule-head-cell" style={{ gridColumn: 1, gridRow: 1 }}>
                  老师
                </div>
                {dateColumns.map((date, index) => (
                  <div
                    className="teacher-schedule-cell teacher-schedule-head-cell"
                    key={formatDateKey(date)}
                    style={{ gridColumn: index + 2, gridRow: 1 }}
                  >
                    <strong>{pad(date.getMonth() + 1)}-{pad(date.getDate())}</strong>
                    <span>{weekNames[date.getDay()]}</span>
                  </div>
                ))}

                {rows.map((row, rowIndex) => {
                  const gridRow = rowIndex + 2;
                  const segments = buildTeacherSegments(row, dateColumns);
                  return (
                    <div className="teacher-schedule-row-fragment" key={row.teacherId}>
                      <div
                        className="teacher-schedule-cell teacher-schedule-fixed teacher-schedule-name"
                        style={{ gridColumn: 1, gridRow }}
                      >
                        {row.teacherName || `老师${row.teacherId}`}
                      </div>
                      {dateColumns.map((date, dateIndex) => (
                        <div
                          className="teacher-schedule-cell teacher-schedule-course-cell"
                          key={`${row.teacherId}-${formatDateKey(date)}`}
                          style={{ gridColumn: dateIndex + 2, gridRow }}
                        />
                      ))}
                      {segments.map((segment) => (
                        <div
                          className="teacher-schedule-bar"
                          key={`${row.teacherId}-${segment.startIndex}-${segment.classId}`}
                          style={{
                            gridColumn: `${segment.startIndex + 2} / span ${segment.length}`,
                            gridRow,
                          }}
                          title={segment.label}
                        >
                          {segment.label}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description="该时间范围暂无老师课表" />
            )}
          </div>

          <div className="teacher-free-panel">
            <Typography.Title level={4}>无课老师</Typography.Title>
            <Typography.Text type="secondary">
              {range.startTime} ~ {range.endTime}
            </Typography.Text>
            <div className="teacher-free-list">
              {freeTeachers.length > 0 ? (
                freeTeachers.map((item) => (
                  <div className="teacher-free-item" key={item.id}>
                    {item.realName || item.nickname || item.username}
                  </div>
                ))
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无无课老师" />
              )}
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
}
