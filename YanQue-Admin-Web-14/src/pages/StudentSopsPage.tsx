import { UploadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Progress, Select, Space, Table, Tag, Upload, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig, UploadFile } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { courseApi, studentLearningPlanApi, studentSopApi, uploadApi, userApi } from '../api/system';
import type { CourseDetailItem, CourseItem, StudentSopItem, StudentSopPageParams, UserItem } from '../types/system';

interface CompleteSopFormValues {
  sopTime: Dayjs;
  sopVideoFile: UploadFile[];
}

interface LearningPlanFormValues {
  courseId: number;
  startDate: Dayjs;
  stages: Array<{ stageName: string; stageDays?: number }>;
}

const statusOptions = [
  { label: '已分配', value: 'ASSIGNED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELED' },
];

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 19);
};

const getStatusText = (status?: string) => {
  if (status === 'ASSIGNED') {
    return '已分配';
  }
  if (status === 'CANCELED') {
    return '已取消';
  }
  if (status === 'COMPLETED') {
    return '已完成';
  }
  return status || '-';
};

const getStatusColor = (status?: string) => {
  if (status === 'COMPLETED') {
    return 'blue';
  }
  if (status === 'ASSIGNED') {
    return 'green';
  }
  return 'default';
};

const createSopVideoObjectKey = (sopId: number, fileName: string) => {
  const uuid = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
  return `student/sop/${sopId}/${dayjs().format('YYYYMMDD')}/${uuid}${extension}`;
};

const uploadFileWithProgress = (url: string, file: File, headers: Record<string, string>, onProgress: (percent: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(new Error('SOP视频上传失败'));
    };
    xhr.onerror = () => reject(new Error('SOP视频上传失败'));
    xhr.send(file);
  });

export default function StudentSopsPage() {
  const [filterForm] = Form.useForm<Partial<StudentSopPageParams>>();
  const [completeForm] = Form.useForm<CompleteSopFormValues>();
  const [learningPlanForm] = Form.useForm<LearningPlanFormValues>();
  const [rows, setRows] = useState<StudentSopItem[]>([]);
  const [advisors, setAdvisors] = useState<UserItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [planStages, setPlanStages] = useState<CourseDetailItem[]>([]);
  const [completing, setCompleting] = useState<StudentSopItem>();
  const [planning, setPlanning] = useState<StudentSopItem>();
  const [playing, setPlaying] = useState<{ title: string; url: string }>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const advisorOptions = advisors.map((item) => ({ label: `${item.realName || item.nickname || item.username} (${item.id})`, value: item.id }));
  const courseOptions = courses
    .filter((item) => item.teachingMode === 'ONLINE')
    .map((item) => ({ label: item.courseName, value: item.id }));

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await studentSopApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10);
    const loadAdvisors = async () => {
      const data = await userApi.page({ pageNum: 1, pageSize: 1000, roleCode: 'ADVISOR', status: 'ACTIVE' });
      setAdvisors(data.records);
    };
    const loadCourses = async () => {
      const data = await courseApi.page({ pageNum: 1, pageSize: 1000 });
      setCourses(data.records);
    };
    void loadAdvisors();
    void loadCourses();
  }, []);

  const openComplete = (record: StudentSopItem) => {
    setCompleting(record);
    completeForm.resetFields();
    setUploadPercent(0);
  };

  const closeComplete = () => {
    setCompleting(undefined);
    setUploadPercent(0);
  };

  const openVideoPreview = async (record: StudentSopItem) => {
    if (!record.sopVideoObjectKey) {
      return;
    }
    setPreviewLoading(true);
    try {
      const data = await uploadApi.presignDownload(record.sopVideoObjectKey);
      setPlaying({ title: record.sopVideoFileName || 'SOP视频', url: data.downloadUrl });
    } finally {
      setPreviewLoading(false);
    }
  };

  const submitComplete = async () => {
    if (!completing) {
      return;
    }
    const values = await completeForm.validateFields();
    const file = values.sopVideoFile?.[0]?.originFileObj;
    if (!file) {
      message.error('请选择SOP视频');
      return;
    }

    setCompleteLoading(true);
    setUploadPercent(0);
    try {
      const objectKey = createSopVideoObjectKey(completing.id, file.name);
      const sign = await uploadApi.presignUpload(objectKey);
      await uploadFileWithProgress(sign.uploadUrl, file, sign.headers || {}, setUploadPercent);

      await studentSopApi.complete(completing.id, {
        sopVideoObjectKey: sign.objectKey,
        sopVideoFileName: file.name,
        sopTime: values.sopTime.format('YYYY-MM-DD HH:mm:ss'),
      });
      message.success('SOP已完成');
      closeComplete();
      await load(pagination.current, pagination.pageSize);
    } finally {
      setCompleteLoading(false);
    }
  };

  const openLearningPlan = (record: StudentSopItem) => {
    setPlanning(record);
    setPlanStages([]);
    learningPlanForm.resetFields();
  };

  const closeLearningPlan = () => {
    setPlanning(undefined);
    setPlanStages([]);
  };

  const handlePlanCourseChange = async (courseId: number) => {
    const details = await courseApi.listDetails(courseId);
    const onlineStages = Array.from(new Map(details.filter((item) => item.stageName).map((item) => [item.stageName, item])).values());
    setPlanStages(onlineStages);
    learningPlanForm.setFieldsValue({
      stages: onlineStages.map((item) => ({ stageName: item.stageName, stageDays: undefined })),
    });
  };

  const submitLearningPlan = async () => {
    if (!planning) {
      return;
    }
    const values = await learningPlanForm.validateFields();
    setPlanLoading(true);
    try {
      const data = await studentLearningPlanApi.create({
        sopId: planning.id,
        courseId: values.courseId,
        startDate: values.startDate.format('YYYY-MM-DD'),
        stages: values.stages.map((item) => ({
          stageName: item.stageName,
          stageDays: Number(item.stageDays),
        })),
      });
      message.success(`学习计划已生成，共${data.calendarCount}天`);
      closeLearningPlan();
    } finally {
      setPlanLoading(false);
    }
  };

  const columns: TableColumnsType<StudentSopItem> = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: '学生姓名', dataIndex: 'studentName', width: 140, render: (value?: string) => value || '-' },
    { title: '手机号', dataIndex: 'studentPhone', width: 140, render: (value?: string) => value || '-' },
    { title: '导师', dataIndex: 'mentorName', width: 140, render: (value?: string) => value || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value?: string) => <Tag color={getStatusColor(value)}>{getStatusText(value)}</Tag>,
    },
    {
      title: 'SOP视频',
      dataIndex: 'sopVideoFileName',
      width: 220,
      render: (value: string | undefined, record) =>
        record.sopVideoObjectKey ? (
          <Button type="link" loading={previewLoading} onClick={() => openVideoPreview(record)}>
            {value || '播放视频'}
          </Button>
        ) : (
          '-'
        ),
    },
    { title: 'SOP时间', dataIndex: 'sopTime', width: 170, render: (value?: string) => formatDateTime(value) },
    { title: '备注', dataIndex: 'remark', width: 220, render: (value?: string) => value || '-' },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (value?: string) => formatDateTime(value) },
    {
      title: '操作',
      dataIndex: 'actions',
      fixed: 'right',
      width: 220,
      render: (_: unknown, record) => (
        <Space>
          {record.status === 'ASSIGNED' ? (
            <Button type="link" onClick={() => openComplete(record)}>
              完成SOP
            </Button>
          ) : null}
          {record.status === 'COMPLETED' && record.teachingMode === 'ONLINE' && !record.learningPlanCreated ? (
            <Button type="link" onClick={() => openLearningPlan(record)}>
              定制学习计划
            </Button>
          ) : null}
          {record.status !== 'ASSIGNED' && !(record.status === 'COMPLETED' && record.teachingMode === 'ONLINE' && !record.learningPlanCreated) ? '-' : null}
        </Space>
      ),
    },
  ];

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
          <Form.Item name="mentorId">
            <Select allowClear showSearch optionFilterProp="label" placeholder="导师" options={advisorOptions} style={{ width: 180 }} />
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
        scroll={{ x: 1630 }}
        onChange={(page: TablePaginationConfig) => load(page.current || 1, page.pageSize || 10)}
      />
      <Modal
        title={completing ? `完成SOP - ${completing.studentName || completing.id}` : '完成SOP'}
        open={!!completing}
        confirmLoading={completeLoading}
        onOk={submitComplete}
        onCancel={closeComplete}
        destroyOnClose
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item name="sopTime" label="SOP时间" rules={[{ required: true, message: '请选择SOP时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="sopVideoFile"
            label="SOP视频"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList || []}
            rules={[
              { required: true, message: '请上传SOP视频' },
              {
                validator: (_, fileList?: UploadFile[]) => {
                  const file = fileList?.[0];
                  if (!file) {
                    return Promise.reject(new Error('请上传SOP视频'));
                  }
                  if (!file.type?.startsWith('video/')) {
                    return Promise.reject(new Error('SOP只支持视频文件'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Upload
              accept="video/*"
              maxCount={1}
              beforeUpload={(file) => {
                if (!file.type?.startsWith('video/')) {
                  message.error('SOP只支持视频文件');
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>选择视频文件</Button>
            </Upload>
          </Form.Item>
          {completeLoading || uploadPercent > 0 ? <Progress percent={uploadPercent} status={uploadPercent === 100 ? 'success' : 'active'} /> : null}
        </Form>
      </Modal>
      <Modal title={playing?.title || 'SOP视频'} open={!!playing} footer={null} onCancel={() => setPlaying(undefined)} destroyOnClose width={820}>
        {playing ? <video src={playing.url} controls style={{ width: '100%', maxHeight: 520 }} /> : null}
      </Modal>
      <Modal
        title={planning ? `定制学习计划 - ${planning.studentName || planning.id}` : '定制学习计划'}
        open={!!planning}
        confirmLoading={planLoading}
        onOk={submitLearningPlan}
        onCancel={closeLearningPlan}
        destroyOnClose
        width={760}
      >
        <Form form={learningPlanForm} layout="vertical">
          <Form.Item name="courseId" label="课程" rules={[{ required: true, message: '请选择课程' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="请选择线上课程"
              options={courseOptions}
              onChange={handlePlanCourseChange}
            />
          </Form.Item>
          <Form.Item name="startDate" label="开始学习日期" rules={[{ required: true, message: '请选择开始学习日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.List name="stages">
            {(fields) => (
              <div>
                {fields.map((field, index) => (
                  <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 12 }}>
                    <Form.Item name={[field.name, 'stageName']} label={index === 0 ? '阶段' : ''}>
                      <Input disabled style={{ width: 220 }} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'stageDays']}
                      label={index === 0 ? '学习天数' : ''}
                      rules={[{ required: true, message: '请输入学习天数' }]}
                    >
                      <InputNumber min={1} precision={0} style={{ width: 180 }} />
                    </Form.Item>
                  </Space>
                ))}
                {planStages.length === 0 ? <div style={{ color: '#999' }}>选择课程后自动带出阶段</div> : null}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
