import { PlayCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Progress, Select, Space, Table, Tag, Tooltip, Upload, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig, UploadFile } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { studentFollowupRecordApi, studentManageApi, uploadApi, userApi } from '../api/system';
import type {
  StudentFollowupRecordItem,
  StudentFollowupRecordPageParams,
  StudentFollowupRecordStats,
  StudentFollowupRecordStatus,
  UserItem,
} from '../types/system';

const { RangePicker } = DatePicker;

interface FilterValues extends Partial<StudentFollowupRecordPageParams> {
  dueDateRange?: [Dayjs, Dayjs];
}

interface CompleteFollowupFormValues {
  followupContent: string;
  followupVideoFile: UploadFile[];
  remark?: string;
}

const statusOptions: Array<{ label: string; value: StudentFollowupRecordStatus }> = [
  { label: '需要回访', value: 'NEED_FOLLOWUP' },
  { label: '已回访', value: 'FOLLOWED' },
  { label: '已取消', value: 'CANCELED' },
];

const statusColor: Record<StudentFollowupRecordStatus, string> = {
  NEED_FOLLOWUP: 'orange',
  FOLLOWED: 'green',
  CANCELED: 'default',
};

const statusText: Record<StudentFollowupRecordStatus, string> = {
  NEED_FOLLOWUP: '需要回访',
  FOLLOWED: '已回访',
  CANCELED: '已取消',
};

const defaultStats: StudentFollowupRecordStats = {
  totalCount: 0,
  todayNeedFollowupCount: 0,
  todayFollowedCount: 0,
  completedCount: 0,
  completionRate: 0,
};

function formatDate(value?: string) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-';
}

function formatDateTime(value?: string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';
}

const createFollowupVideoObjectKey = (recordId: number, fileName: string) => {
  const uuid = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
  return `student/followup/${recordId}/${dayjs().format('YYYYMMDD')}/${uuid}${extension}`;
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
      reject(new Error('上传失败'));
    };
    xhr.onerror = () => reject(new Error('上传失败'));
    xhr.send(file);
  });

export default function StudentFollowupRecordsPage() {
  const [filterForm] = Form.useForm<FilterValues>();
  const [completeForm] = Form.useForm<CompleteFollowupFormValues>();
  const [rows, setRows] = useState<StudentFollowupRecordItem[]>([]);
  const [stats, setStats] = useState<StudentFollowupRecordStats>(defaultStats);
  const [studentTags, setStudentTags] = useState<string[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [completing, setCompleting] = useState<StudentFollowupRecordItem>();
  const [playing, setPlaying] = useState<{ title: string; url: string }>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const studentTagOptions = useMemo(() => studentTags.map((item) => ({ label: item, value: item })), [studentTags]);
  const userOptions = useMemo(
    () => users.map((item) => ({ label: `${item.realName || item.nickname || item.username} (${item.id})`, value: item.id })),
    [users],
  );
  const statsCards = useMemo(
    () => [
      { label: '总回访数', value: stats.totalCount, accent: 'blue' },
      { label: '今日待回访', value: stats.todayNeedFollowupCount, accent: 'orange' },
      { label: '今日回访数', value: stats.todayFollowedCount, accent: 'green' },
      { label: '完成比例', value: `${Number(stats.completionRate || 0).toFixed(1)}%`, accent: 'purple' },
    ],
    [stats],
  );

  const buildParams = (pageNum: number, pageSize: number): StudentFollowupRecordPageParams => {
    const values = filterForm.getFieldsValue();
    return {
      studentName: values.studentName,
      studentPhone: values.studentPhone,
      studentTag: values.studentTag,
      status: values.status,
      followupUserId: values.followupUserId,
      startDate: values.dueDateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: values.dueDateRange?.[1]?.format('YYYY-MM-DD'),
      pageNum,
      pageSize,
    };
  };

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const data = await studentFollowupRecordApi.page(buildParams(pageNum, pageSize));
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      setStats(await studentFollowupRecordApi.stats());
    } finally {
      setStatsLoading(false);
    }
  };

  const loadOptions = async () => {
    const [tagData, userData] = await Promise.all([
      studentManageApi.tagOptions(),
      userApi.page({ pageNum: 1, pageSize: 1000 }),
    ]);
    setStudentTags(tagData);
    setUsers(userData.records);
  };

  useEffect(() => {
    void loadOptions();
    void loadStats();
    void load(1, 10);
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await studentFollowupRecordApi.generate();
      message.success(`已生成 ${res.generatedCount} 条回访记录`);
      void load(1, pagination.pageSize);
      void loadStats();
    } finally {
      setGenerating(false);
    }
  };

  const openComplete = (record: StudentFollowupRecordItem) => {
    setCompleting(record);
    completeForm.resetFields();
    setUploadPercent(0);
  };

  const closeComplete = () => {
    setCompleting(undefined);
    setUploadPercent(0);
  };

  const openVideoPreview = async (record: StudentFollowupRecordItem) => {
    if (!record.followupVideoObjectKey) {
      return;
    }
    setPreviewLoading(true);
    try {
      const data = await uploadApi.presignDownload(record.followupVideoObjectKey);
      setPlaying({ title: record.followupVideoFileName || '回访会议视频', url: data.downloadUrl });
    } finally {
      setPreviewLoading(false);
    }
  };

  const submitComplete = async () => {
    if (!completing) {
      return;
    }
    const values = await completeForm.validateFields();
    const file = values.followupVideoFile?.[0]?.originFileObj;
    if (!file) {
      message.error('请上传回访会议视频');
      return;
    }

    setCompleteLoading(true);
    setUploadPercent(0);
    try {
      const objectKey = createFollowupVideoObjectKey(completing.id, file.name);
      const sign = await uploadApi.presignUpload(objectKey);
      await uploadFileWithProgress(sign.uploadUrl, file, sign.headers || {}, setUploadPercent);
      await studentFollowupRecordApi.complete(completing.id, {
        followupContent: values.followupContent,
        followupVideoObjectKey: sign.objectKey,
        followupVideoFileName: file.name,
        remark: values.remark,
      });
      message.success('回访已记录');
      closeComplete();
      void load();
      void loadStats();
    } finally {
      setCompleteLoading(false);
    }
  };

  const cancelRecord = async (record: StudentFollowupRecordItem) => {
    await studentFollowupRecordApi.cancel(record.id, { remark: '后台取消' });
    message.success('回访已取消');
    void load();
    void loadStats();
  };

  const columns: TableColumnsType<StudentFollowupRecordItem> = [
    { title: '学生姓名', dataIndex: 'studentName', width: 120, render: (value?: string) => value || '-' },
    { title: '手机号', dataIndex: 'studentPhone', width: 130, render: (value?: string) => value || '-' },
    { title: '学生标签', dataIndex: 'studentTag', width: 130 },
    { title: '入学日期', dataIndex: 'enrollDate', width: 120, render: formatDate },
    { title: '上次回访时间', dataIndex: 'lastFollowupTime', width: 150, render: formatDateTime },
    { title: '应回访日期', dataIndex: 'dueDate', width: 130, render: formatDate },
    {
      title: '间隔',
      dataIndex: 'followupIntervalDays',
      width: 90,
      render: (value: number) => `${value}天`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: StudentFollowupRecordStatus) => <Tag color={statusColor[value]}>{statusText[value] || value}</Tag>,
    },
    { title: '回访人', dataIndex: 'followupUserName', width: 120, render: (value?: string) => value || '-' },
    { title: '回访时间', dataIndex: 'followupTime', width: 150, render: formatDateTime },
    {
      title: '回访内容',
      dataIndex: 'followupContent',
      width: 240,
      render: (value?: string) =>
        value ? (
          <Tooltip title={value}>
            <div className="followup-content-preview">{value}</div>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '会议视频',
      dataIndex: 'followupVideoFileName',
      width: 190,
      render: (value: string | undefined, record) =>
        record.followupVideoObjectKey ? (
          <Tooltip title={value || '查看视频'}>
            <Button
              type="text"
              size="small"
              className="followup-video-link"
              icon={<PlayCircleOutlined />}
              loading={previewLoading}
              onClick={() => openVideoPreview(record)}
            >
              <span>{value || '查看视频'}</span>
            </Button>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      render: (_, record) =>
        record.status === 'NEED_FOLLOWUP' ? (
          <Space>
            <Button type="link" onClick={() => openComplete(record)}>
              记录回访
            </Button>
            <Popconfirm title="确认取消该回访？" onConfirm={() => cancelRecord(record)}>
              <Button type="link" danger>
                取消
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div className="page-panel">
      <div className="table-toolbar">
        <Form form={filterForm} layout="inline" className="filter-row">
          <Form.Item name="studentName">
            <Input allowClear placeholder="学生姓名" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="studentPhone">
            <Input allowClear placeholder="手机号" style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="studentTag">
            <Select allowClear placeholder="学生标签" options={studentTagOptions} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="全部状态" options={statusOptions} style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="followupUserId">
            <Select allowClear showSearch placeholder="回访人" options={userOptions} optionFilterProp="label" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="dueDateRange">
            <RangePicker />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button loading={generating} onClick={generate}>
          手动生成
        </Button>
      </div>

      <div className="followup-stats">
        {statsCards.map((item) => (
          <div key={item.label} className={`followup-stat-item followup-stat-${item.accent}`}>
            <div className="followup-stat-label">{item.label}</div>
            <div className="followup-stat-value">{statsLoading ? '-' : item.value}</div>
          </div>
        ))}
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={pagination}
        scroll={{ x: 1300 }}
        onChange={(page: TablePaginationConfig) => load(page.current || 1, page.pageSize || 10)}
      />

      <Modal
        title={completing ? `记录回访 - ${completing.studentName || completing.studentId}` : '记录回访'}
        open={!!completing}
        confirmLoading={completeLoading}
        onOk={submitComplete}
        onCancel={closeComplete}
        destroyOnHidden
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item name="followupContent" label="回访内容" rules={[{ required: true, message: '请输入回访内容' }]}>
            <Input.TextArea rows={4} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item
            name="followupVideoFile"
            label="回访会议视频"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList || []}
            rules={[
              { required: true, message: '请上传回访会议视频' },
              {
                validator: (_, fileList?: UploadFile[]) => {
                  const file = fileList?.[0];
                  if (!file) {
                    return Promise.reject(new Error('请上传回访会议视频'));
                  }
                  if (!file.type?.startsWith('video/')) {
                    return Promise.reject(new Error('回访会议只支持视频文件'));
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
                  message.error('回访会议只支持视频文件');
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>选择视频文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} maxLength={200} showCount />
          </Form.Item>
          {completeLoading || uploadPercent > 0 ? <Progress percent={uploadPercent} status={uploadPercent === 100 ? 'success' : 'active'} /> : null}
        </Form>
      </Modal>
      <Modal title={playing?.title || '回访会议视频'} open={!!playing} footer={null} onCancel={() => setPlaying(undefined)} destroyOnHidden width={820}>
        {playing ? <video src={playing.url} controls style={{ width: '100%', maxHeight: 520 }} /> : null}
      </Modal>
    </div>
  );
}
