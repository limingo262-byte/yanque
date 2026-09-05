import { Button, Empty, Input, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { classDutyApi, userApi } from '../api/system';
import type { ClassDutyDateCampusItem, ClassDutyDateClassItem, ClassDutyType, UserItem } from '../types/system';

const dutyTypeColor: Record<ClassDutyType, string> = {
  EVENING_STUDY_CLASS: 'blue',
  EVENING_STUDY_CAMPUS: 'purple',
  SELF_STUDY_CLASS: 'green',
};

const classTypeColor: Record<string, string> = {
  CLASS: 'blue',
  SELF_STUDY: 'green',
};

function todayText() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function ClassDutiesPage() {
  const [dutyDate, setDutyDate] = useState(todayText());
  const [classRows, setClassRows] = useState<ClassDutyDateClassItem[]>([]);
  const [campusRows, setCampusRows] = useState<ClassDutyDateCampusItem[]>([]);
  const [teachers, setTeachers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const teacherOptions = useMemo(
    () => teachers.map((item) => ({ label: `${item.realName || item.nickname || item.username} (${item.id})`, value: item.id })),
    [teachers],
  );

  const loadTeachers = async () => {
    const data = await userApi.page({ pageNum: 1, pageSize: 1000, roleCode: 'TEACHER' });
    setTeachers(data.records);
  };

  const loadDateDuty = async (date = dutyDate) => {
    if (!date) {
      message.warning('请选择日期');
      return;
    }
    setLoading(true);
    try {
      const data = await classDutyApi.date(date);
      setClassRows(data.classDutyList || []);
      setCampusRows(data.campusDutyList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeachers();
    void loadDateDuty(dutyDate);
  }, []);

  const updateClassTeacher = (classId: number, teacherId?: number) => {
    setClassRows((rows) => rows.map((item) => (item.classId === classId ? { ...item, teacherId } : item)));
  };

  const updateCampusTeacher = (campusId: number, teacherId?: number) => {
    setCampusRows((rows) => rows.map((item) => (item.campusId === campusId ? { ...item, teacherId } : item)));
  };

  const submit = async () => {
    if (!dutyDate) {
      message.warning('请选择日期');
      return;
    }
    const missClass = classRows.find((item) => !item.teacherId);
    if (missClass) {
      message.warning(`请选择 ${missClass.classPeriod || missClass.classId} 的值班老师`);
      return;
    }
    const missCampus = campusRows.find((item) => !item.teacherId);
    if (missCampus) {
      message.warning(`请选择 ${missCampus.campusName || missCampus.campusId} 的统一值班老师`);
      return;
    }

    setSaving(true);
    try {
      const result = await classDutyApi.saveDate({
        dutyDate,
        classDutyList: classRows.map((item) => ({
          classId: item.classId,
          teacherId: item.teacherId as number,
          dutyType: item.dutyType,
        })),
        campusDutyList: campusRows.map((item) => ({
          campusId: item.campusId,
          teacherId: item.teacherId as number,
          dutyType: item.dutyType,
        })),
      });
      message.success(`值班已保存，共 ${result.saveCount} 条`);
      void loadDateDuty(dutyDate);
    } finally {
      setSaving(false);
    }
  };

  const classColumns: TableColumnsType<ClassDutyDateClassItem> = [
    {
      title: '班级',
      dataIndex: 'classPeriod',
      width: 150,
      render: (value: string, record) => value || record.classId,
    },
    {
      title: '校区',
      dataIndex: 'campusName',
      width: 220,
      render: (value: string, record) => value || record.campusId,
    },
    {
      title: '当天类型',
      dataIndex: 'classTypeDesc',
      width: 120,
      render: (value: string, record) => <Tag color={classTypeColor[record.classType]}>{value || record.classType}</Tag>,
    },
    {
      title: '值班类型',
      dataIndex: 'dutyTypeDesc',
      width: 150,
      render: (value: string, record) => <Tag color={dutyTypeColor[record.dutyType]}>{value || record.dutyType}</Tag>,
    },
    {
      title: '时间',
      width: 130,
      render: (_, record) => `${record.startTime}-${record.endTime}`,
    },
    {
      title: '课程内容',
      dataIndex: 'courseContent',
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: '值班老师',
      width: 220,
      render: (_, record) => (
        <Select
          allowClear
          showSearch
          placeholder="选择老师"
          value={record.teacherId}
          options={teacherOptions}
          optionFilterProp="label"
          style={{ width: 190 }}
          onChange={(value) => updateClassTeacher(record.classId, value)}
        />
      ),
    },
  ];

  const campusColumns: TableColumnsType<ClassDutyDateCampusItem> = [
    {
      title: '校区',
      dataIndex: 'campusName',
      render: (value: string, record) => value || record.campusId,
    },
    {
      title: '值班类型',
      dataIndex: 'dutyTypeDesc',
      width: 170,
      render: (value: string, record) => <Tag color={dutyTypeColor[record.dutyType]}>{value || record.dutyType}</Tag>,
    },
    {
      title: '时间',
      width: 150,
      render: (_, record) => `${record.startTime}-${record.endTime}`,
    },
    {
      title: '统一值班老师',
      width: 240,
      render: (_, record) => (
        <Select
          allowClear
          showSearch
          placeholder="选择老师"
          value={record.teacherId}
          options={teacherOptions}
          optionFilterProp="label"
          style={{ width: 210 }}
          onChange={(value) => updateCampusTeacher(record.campusId, value)}
        />
      ),
    },
  ];

  return (
    <div className="page-panel duty-page">
      <div className="duty-header">
        <div>
          <Typography.Title level={3}>值班管理</Typography.Title>
          <Typography.Text type="secondary">选择日期后，展示当天上课或自习的班级，并统一安排晚自习值班。</Typography.Text>
        </div>
        <Space>
          <span className="duty-date-label">日期</span>
          <Input type="date" value={dutyDate} onChange={(event) => setDutyDate(event.target.value)} style={{ width: 170 }} />
          <Button onClick={() => loadDateDuty(dutyDate)}>查询</Button>
          <Button type="primary" loading={saving} onClick={submit}>
            保存值班
          </Button>
        </Space>
      </div>

      <div className="duty-section">
        <div className="duty-section-title">
          <Typography.Title level={4}>班级值班</Typography.Title>
          <Typography.Text type="secondary">上课日为晚自习值班，自习日为自习日值班。</Typography.Text>
        </div>
        <Table
          rowKey={(record) => `${record.classId}-${record.dutyType}`}
          loading={loading}
          columns={classColumns}
          dataSource={classRows}
          pagination={false}
          locale={{ emptyText: <Empty description="当天没有上课或自习的班级" /> }}
        />
      </div>

      <div className="duty-section">
        <div className="duty-section-title">
          <Typography.Title level={4}>校区统一值班</Typography.Title>
          <Typography.Text type="secondary">晚自习 21:00-22:30 统一值班。</Typography.Text>
        </div>
        <Table
          rowKey={(record) => record.campusId}
          loading={loading}
          columns={campusColumns}
          dataSource={campusRows}
          pagination={false}
          locale={{ emptyText: <Empty description="当天没有需要统一值班的校区" /> }}
        />
      </div>
    </div>
  );
}
