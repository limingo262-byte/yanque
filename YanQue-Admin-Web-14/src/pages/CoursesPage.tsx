import { UploadOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Progress, Select, Space, Table, Tag, Upload, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig, UploadFile, UploadProps } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { courseApi, uploadApi } from '../api/system';
import type {
  ActiveStatus,
  CourseDetailItem,
  CourseDetailValues,
  CourseHomeworkTemplateItem,
  CourseHomeworkTemplateValues,
  CourseItem,
  CoursePageParams,
  CourseValues,
} from '../types/system';

interface TemplateFormValues extends Omit<CourseHomeworkTemplateValues, 'contentObjectKey' | 'contentFileName'> {
  templateFile?: UploadFile[];
}

const teachingModeOptions = [
  { label: '线上', value: 'ONLINE' },
  { label: '线下', value: 'OFFLINE' },
];

const statusOptions: Array<{ label: string; value: ActiveStatus }> = [
  { label: '生效', value: 'ACTIVE' },
  { label: '失效', value: 'INACTIVE' },
];

const buildStageOptions = (details: CourseDetailItem[]) => {
  const stageNames = Array.from(new Set(details.map((item) => item.stageName).filter(Boolean)));
  return stageNames.map((stageName) => ({ label: stageName, value: stageName }));
};

const buildDayOptions = (details: CourseDetailItem[]) => {
  const dayDetails = Array.from(new Map(details.filter((item) => item.dayNumber).map((item) => [item.dayNumber, item])).values());
  return dayDetails
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((item) => ({
      label: item.classContent ? `第${item.dayNumber}天 - ${item.classContent}` : `第${item.dayNumber}天`,
      value: item.dayNumber,
    }));
};

const createTemplateObjectKey = (courseId: number, fileName: string) => {
  const uuid = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '.md';
  return `course/homework-template/${courseId}/${dayjs().format('YYYYMMDD')}/${uuid}${extension}`;
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
      reject(new Error('作业标准文件上传失败'));
    };
    xhr.onerror = () => reject(new Error('作业标准文件上传失败'));
    xhr.send(file);
  });

export default function CoursesPage() {
  const [form] = Form.useForm<CourseValues>();
  const [detailForm] = Form.useForm<CourseDetailValues>();
  const [templateForm] = Form.useForm<TemplateFormValues>();
  const [filterForm] = Form.useForm<Partial<CoursePageParams>>();
  const [rows, setRows] = useState<CourseItem[]>([]);
  const [detailRows, setDetailRows] = useState<CourseDetailItem[]>([]);
  const [detailStageOptions, setDetailStageOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [templateRows, setTemplateRows] = useState<CourseHomeworkTemplateItem[]>([]);
  const [templateDetailRows, setTemplateDetailRows] = useState<CourseDetailItem[]>([]);
  const [templateStageOptions, setTemplateStageOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [templateDayOptions, setTemplateDayOptions] = useState<Array<{ label: string; value: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [editing, setEditing] = useState<CourseItem>();
  const [detailEditing, setDetailEditing] = useState<CourseDetailItem>();
  const [templateEditing, setTemplateEditing] = useState<CourseHomeworkTemplateItem>();
  const [currentCourse, setCurrentCourse] = useState<CourseItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailFormOpen, setDetailFormOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateUploadPercent, setTemplateUploadPercent] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const selectedTemplateDayNumber = Form.useWatch('dayNumber', templateForm);
  const selectedTemplateDayDetail = templateDetailRows.find((item) => item.dayNumber === selectedTemplateDayNumber);

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await courseApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10);
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({ teachingMode: 'ONLINE' });
    setModalOpen(true);
  };

  const openEdit = async (record: CourseItem) => {
    const detail = await courseApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await courseApi.update(editing.id, values);
      message.success('课程已更新');
    } else {
      await courseApi.create(values);
      message.success('课程已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await courseApi.remove(id);
    message.success('课程已删除');
    void load();
  };

  const loadDetails = async (courseId = currentCourse?.id) => {
    if (!courseId) {
      return;
    }
    setDetailLoading(true);
    try {
      const [data, stages] = await Promise.all([
        courseApi.listDetails(courseId),
        courseApi.listStages(courseId),
      ]);
      setDetailRows(data);
      setDetailStageOptions(stages.map((stageName) => ({ label: stageName, value: stageName })));
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetailManage = async (record: CourseItem) => {
    setCurrentCourse(record);
    setDetailModalOpen(true);
    await loadDetails(record.id);
  };

  const openDetailCreate = () => {
    if (detailStageOptions.length === 0) {
      message.warning('当前课程暂无可选阶段，请先通过导入流程建立阶段');
      return;
    }
    setDetailEditing(undefined);
    detailForm.resetFields();
    setDetailFormOpen(true);
  };

  const openDetailEdit = async (record: CourseDetailItem) => {
    const detail = await courseApi.detailItem(record.id);
    setDetailEditing(detail);
    detailForm.setFieldsValue(detail);
    setDetailFormOpen(true);
  };

  const submitDetail = async () => {
    if (!currentCourse) {
      return;
    }
    const values = await detailForm.validateFields();
    if (detailEditing) {
      await courseApi.updateDetail(detailEditing.id, values);
      message.success('课程详情已更新');
    } else {
      await courseApi.createDetail(currentCourse.id, values);
      message.success('课程详情已创建');
    }
    setDetailFormOpen(false);
    void loadDetails(currentCourse.id);
  };

  const removeDetail = async (id: number) => {
    await courseApi.removeDetail(id);
    message.success('课程详情已删除');
    void loadDetails();
  };

  const loadTemplates = async (courseId = currentCourse?.id) => {
    if (!courseId) {
      return;
    }
    setTemplateLoading(true);
    try {
      const data = await courseApi.listHomeworkTemplates(courseId);
      setTemplateRows(data);
    } finally {
      setTemplateLoading(false);
    }
  };

  const openTemplateManage = async (record: CourseItem) => {
    setCurrentCourse(record);
    setTemplateModalOpen(true);
    const detailData = await courseApi.listDetails(record.id);
    setTemplateDetailRows(detailData);
    setTemplateStageOptions(buildStageOptions(detailData));
    setTemplateDayOptions(buildDayOptions(detailData));
    await loadTemplates(record.id);
  };

  const openTemplateCreate = () => {
    setTemplateEditing(undefined);
    templateForm.resetFields();
    templateForm.setFieldsValue({ status: 'ACTIVE' });
    setTemplateUploadPercent(0);
    setTemplateFormOpen(true);
  };

  const openTemplateEdit = async (record: CourseHomeworkTemplateItem) => {
    const detail = await courseApi.homeworkTemplateDetail(record.id);
    setTemplateEditing(detail);
    templateForm.resetFields();
    templateForm.setFieldsValue({
      stageName: detail.stageName,
      dayNumber: detail.dayNumber,
      status: detail.status,
      remark: detail.remark,
    });
    setTemplateUploadPercent(0);
    setTemplateFormOpen(true);
  };

  const submitTemplate = async () => {
    if (!currentCourse) {
      return;
    }
    const values = await templateForm.validateFields();
    const file = values.templateFile?.[0]?.originFileObj;
    let contentObjectKey = templateEditing?.contentObjectKey;
    let contentFileName = templateEditing?.contentFileName;

    setTemplateSaving(true);
    setTemplateUploadPercent(0);
    try {
      if (file) {
        const objectKey = createTemplateObjectKey(currentCourse.id, file.name);
        const sign = await uploadApi.presignUpload(objectKey);
        await uploadFileWithProgress(sign.uploadUrl, file, sign.headers || {}, setTemplateUploadPercent);
        contentObjectKey = sign.objectKey;
        contentFileName = file.name;
      }
      if (!contentObjectKey || !contentFileName) {
        message.error('请上传作业标准文档');
        return;
      }

      const payload: CourseHomeworkTemplateValues = {
        stageName: currentCourse.teachingMode === 'ONLINE' ? values.stageName : undefined,
        dayNumber: currentCourse.teachingMode === 'OFFLINE' ? values.dayNumber : undefined,
        contentObjectKey,
        contentFileName,
        status: values.status,
        remark: values.remark,
      };

      if (templateEditing) {
        await courseApi.updateHomeworkTemplate(templateEditing.id, payload);
        message.success('作业标准已更新');
      } else {
        await courseApi.createHomeworkTemplate(currentCourse.id, payload);
        message.success('作业标准已创建');
      }
      setTemplateFormOpen(false);
      await loadTemplates(currentCourse.id);
    } finally {
      setTemplateSaving(false);
    }
  };

  const removeTemplate = async (id: number) => {
    await courseApi.removeHomeworkTemplate(id);
    message.success('作业标准已删除');
    void loadTemplates();
  };

  const uploadDetailFile: UploadProps['customRequest'] = async ({ file, onError, onSuccess }) => {
    if (!currentCourse) {
      onError?.(new Error('请先选择课程'));
      return;
    }
    try {
      await courseApi.importDetails(currentCourse.id, file as File);
      message.success('课程详情导入成功');
      onSuccess?.({});
      void loadDetails(currentCourse.id);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const getStageRowSpan = (index?: number) => {
    if (index === undefined) {
      return 1;
    }
    const current = detailRows[index];
    if (!current) {
      return 1;
    }
    if (index > 0 && detailRows[index - 1]?.stageName === current.stageName) {
      return 0;
    }
    let rowSpan = 1;
    for (let i = index + 1; i < detailRows.length; i += 1) {
      if (detailRows[i].stageName !== current.stageName) {
        break;
      }
      rowSpan += 1;
    }
    return rowSpan;
  };

  const columns: TableColumnsType<CourseItem> = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: '课程名称', dataIndex: 'courseName', width: 220 },
    { title: '课程天数', dataIndex: 'courseDays', width: 120 },
    {
      title: '上课方式',
      dataIndex: 'teachingMode',
      width: 120,
      render: (value: string) => <Tag color={value === 'ONLINE' ? 'blue' : 'green'}>{teachingModeOptions.find((item) => item.value === value)?.label || value}</Tag>,
    },
    { title: '资料路径', dataIndex: 'materialPath', ellipsis: true },
    {
      title: '操作',
      width: 320,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openDetailManage(record)}>
            课程详情
          </Button>
          <Button type="link" onClick={() => openTemplateManage(record)}>
            作业标准
          </Button>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该课程？" onConfirm={() => remove(record.id)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const detailColumns: TableColumnsType<CourseDetailItem> = [
    {
      title: '阶段',
      dataIndex: 'stageName',
      width: 140,
      onCell: (_, index) => currentCourse?.teachingMode === 'OFFLINE' ? ({
        rowSpan: getStageRowSpan(index),
        style: { verticalAlign: 'middle', fontWeight: 500 },
      }) : ({ style: { fontWeight: 500 } }),
    },
    ...(currentCourse?.teachingMode === 'OFFLINE'
      ? [
          { title: '第几天', dataIndex: 'dayNumber', width: 100, align: 'center' as const },
          { title: '上课内容', dataIndex: 'classContent', ellipsis: true },
        ]
      : []),
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (value?: string) => value ? dayjs(value).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openDetailEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该课程详情？" onConfirm={() => removeDetail(record.id)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const templateColumns: TableColumnsType<CourseHomeworkTemplateItem> = [
    {
      title: currentCourse?.teachingMode === 'ONLINE' ? '阶段' : '第几天',
      width: 120,
      render: (_, record) => {
        if (currentCourse?.teachingMode === 'ONLINE') {
          return templateStageOptions.find((item) => item.value === record.stageName)?.label || record.stageName || '-';
        }
        return record.dayNumber ? `第${record.dayNumber}天` : '-';
      },
    },
    { title: '标准文档', dataIndex: 'contentFileName', width: 220, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: ActiveStatus) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>{value === 'ACTIVE' ? '生效' : '失效'}</Tag>,
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true, render: (value?: string) => value || '-' },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openTemplateEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该作业标准？" onConfirm={() => removeTemplate(record.id)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-panel">
      <div className="table-toolbar">
        <Form form={filterForm} layout="inline" className="filter-row">
          <Form.Item name="keyword">
            <Input allowClear placeholder="课程名称/资料路径" />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增课程
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={pagination}
        onChange={(page: TablePaginationConfig) => load(page.current || 1, page.pageSize || 10)}
      />

      <Modal title={editing ? '编辑课程' : '新增课程'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="courseName" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="courseDays" label="课程天数" rules={[{ required: true, message: '请输入课程天数' }]}>
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="teachingMode" label="上课方式" rules={[{ required: true, message: '请选择上课方式' }]}>
            <Select placeholder="请选择上课方式" options={teachingModeOptions} />
          </Form.Item>
          <Form.Item name="materialPath" label="资料路径" rules={[{ required: true, message: '请输入资料路径' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`课程详情管理${currentCourse ? ` - ${currentCourse.courseName}` : ''}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={1100}
        destroyOnHidden
      >
        <div className="table-toolbar">
          <Space>
            <Tag color={currentCourse?.teachingMode === 'ONLINE' ? 'blue' : 'green'}>
              {currentCourse?.teachingMode === 'ONLINE' ? '线上只维护阶段' : '线下维护阶段/天数/课程内容'}
            </Tag>
            <Button type="primary" onClick={openDetailCreate}>
              新增一条
            </Button>
            <Upload
              accept=".xlsx,.xls"
              customRequest={uploadDetailFile}
              maxCount={1}
              showUploadList={false}
              disabled={currentCourse?.teachingMode !== 'OFFLINE'}
            >
              <Button disabled={currentCourse?.teachingMode !== 'OFFLINE'}>上传阶段 Excel</Button>
            </Upload>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={detailLoading}
          columns={detailColumns}
          dataSource={detailRows}
          pagination={false}
          scroll={{ y: 520 }}
        />
      </Modal>

      <Modal
        title={detailEditing ? '编辑课程详情' : '新增课程详情'}
        open={detailFormOpen}
        onOk={submitDetail}
        onCancel={() => setDetailFormOpen(false)}
        destroyOnHidden
      >
        <Form form={detailForm} layout="vertical">
          <Form.Item name="stageName" label="阶段" rules={[{ required: true, message: '请选择阶段' }]}>
            <Select placeholder="请选择阶段" options={detailStageOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          {currentCourse?.teachingMode === 'OFFLINE' ? (
            <>
              <Form.Item name="dayNumber" label="第几天" rules={[{ required: true, message: '请输入第几天' }]}>
                <InputNumber min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="classContent" label="上课内容" rules={[{ required: true, message: '请输入上课内容' }]}>
                <Input.TextArea rows={5} />
              </Form.Item>
            </>
          ) : null}
        </Form>
      </Modal>

      <Modal
        title={`作业标准/训练集${currentCourse ? ` - ${currentCourse.courseName}` : ''}`}
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        footer={null}
        width={1100}
        destroyOnHidden
      >
        <div className="table-toolbar">
          <Space>
            <Tag color={currentCourse?.teachingMode === 'ONLINE' ? 'blue' : 'green'}>
              {currentCourse?.teachingMode === 'ONLINE' ? '线上按阶段配置' : '线下按天配置'}
            </Tag>
            <Button type="primary" onClick={openTemplateCreate}>
              新增标准
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={templateLoading}
          columns={templateColumns}
          dataSource={templateRows}
          pagination={false}
          scroll={{ y: 520 }}
        />
      </Modal>

      <Modal
        title={templateEditing ? '编辑作业标准' : '新增作业标准'}
        open={templateFormOpen}
        onOk={submitTemplate}
        confirmLoading={templateSaving}
        onCancel={() => setTemplateFormOpen(false)}
        destroyOnHidden
      >
        <Form form={templateForm} layout="vertical">
          {currentCourse?.teachingMode === 'ONLINE' ? (
            <Form.Item name="stageName" label="阶段" rules={[{ required: true, message: '请选择阶段' }]}>
              <Select placeholder="请选择阶段" options={templateStageOptions} />
            </Form.Item>
          ) : (
            <Form.Item name="dayNumber" label="第几天" rules={[{ required: true, message: '请输入第几天' }]}>
              <Select placeholder="请选择第几天" options={templateDayOptions} />
            </Form.Item>
          )}
          {currentCourse?.teachingMode === 'OFFLINE' && selectedTemplateDayDetail ? (
            <Form.Item label="课程内容">
              <Input.TextArea value={selectedTemplateDayDetail.classContent} rows={3} disabled />
            </Form.Item>
          ) : null}
          <Form.Item
            name="templateFile"
            label="作业标准文档"
            rules={[{ required: !templateEditing, message: '请上传作业标准文档' }]}
            valuePropName="fileList"
            getValueFromEvent={(event) => (Array.isArray(event) ? event : event?.fileList)}
          >
            <Upload beforeUpload={() => false} maxCount={1} accept=".md">
              <Button icon={<UploadOutlined />}>选择 md 文件</Button>
            </Upload>
          </Form.Item>
          {templateEditing?.contentFileName && !templateForm.getFieldValue('templateFile')?.length ? (
            <div style={{ marginTop: -12, marginBottom: 16, color: '#666' }}>当前文件：{templateEditing.contentFileName}</div>
          ) : null}
          {templateUploadPercent > 0 ? <Progress percent={templateUploadPercent} /> : null}
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
