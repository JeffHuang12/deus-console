import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type { Comparator, MonitorRule, NotifyChannel } from "../api/types";

const METRICS = [
  { value: "roas", label: "ROAS" },
  { value: "conversion_rate", label: "轉換率" },
  { value: "orders", label: "訂單數" },
  { value: "revenue", label: "營收" },
  { value: "ad_spend", label: "廣告花費" },
  { value: "stock", label: "庫存量" },
];

// 規則範本:一鍵帶入常用監測組合(Phase 2 由排程讀 BigQuery/GA4 比對)
const RULE_TEMPLATES: {
  key: string;
  label: string;
  values: { metric: string; comparator: Comparator; threshold: number; notify: NotifyChannel };
}[] = [
  { key: "ga4_anomaly", label: "GA4 異常", values: { metric: "conversion_rate", comparator: "change_pct", threshold: 20, notify: "line" } },
  { key: "order_anomaly", label: "訂單異常", values: { metric: "orders", comparator: "change_pct", threshold: 30, notify: "email" } },
  { key: "oos_pause_ad", label: "缺貨暫停廣告", values: { metric: "stock", comparator: "lt", threshold: 50, notify: "webhook" } },
];

const COMPARATORS: { value: Comparator; label: string }[] = [
  { value: "gt", label: "大於" },
  { value: "lt", label: "小於" },
  { value: "change_pct", label: "變化百分比超過" },
];

const NOTIFY: { value: NotifyChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "line", label: "LINE" },
  { value: "webhook", label: "Webhook" },
];

const labelOf = (arr: { value: string; label: string }[], v: string) =>
  arr.find((x) => x.value === v)?.label ?? v;

export default function MonitoringPage() {
  const [rules, setRules] = useState<MonitorRule[]>([]);
  const [form] = Form.useForm();

  const reload = () => api.listRules().then(setRules);

  useEffect(() => {
    reload();
  }, []);

  const onCreate = async (values: any) => {
    await api.createRule({ enabled: true, ...values });
    message.success("已新增監測規則");
    form.resetFields();
    reload();
  };

  const toggle = async (rule: MonitorRule, enabled: boolean) => {
    await api.updateRule(rule.id, { ...rule, enabled });
    reload();
  };

  const remove = async (id: number) => {
    await api.deleteRule(id);
    message.success("已刪除");
    reload();
  };

  const columns = [
    { title: "指標", dataIndex: "metric", render: (v: string) => labelOf(METRICS, v) },
    {
      title: "條件",
      dataIndex: "comparator",
      render: (v: Comparator) => labelOf(COMPARATORS, v),
    },
    { title: "門檻值", dataIndex: "threshold" },
    {
      title: "通知方式",
      dataIndex: "notify",
      render: (v: NotifyChannel) => <Tag>{labelOf(NOTIFY, v)}</Tag>,
    },
    {
      title: "啟用",
      dataIndex: "enabled",
      render: (v: boolean, r: MonitorRule) => (
        <Switch checked={v} onChange={(c) => toggle(r, c)} />
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, r: MonitorRule) => (
        <Popconfirm title="確認刪除這條規則?" onConfirm={() => remove(r.id)}>
          <Button danger size="small">
            刪除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="監測中心"
        description="自訂指標門檻與通知方式。本期規則暫存於後端記憶體,觸發告警邏輯於後續接通 BigQuery。"
      />

      <Card title="新增監測規則" style={{ marginBottom: 24 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <span>規則範本:</span>
          {RULE_TEMPLATES.map((t) => (
            <Button
              key={t.key}
              size="small"
              onClick={() => {
                form.setFieldsValue(t.values);
                message.info(`已帶入「${t.label}」範本,可調整後新增`);
              }}
            >
              {t.label}
            </Button>
          ))}
        </Space>
        <Form
          form={form}
          layout="inline"
          onFinish={onCreate}
          initialValues={{ comparator: "lt", notify: "email", threshold: 2 }}
        >
          <Form.Item name="metric" label="指標" rules={[{ required: true }]}>
            <Select options={METRICS} style={{ width: 140 }} placeholder="選擇指標" />
          </Form.Item>
          <Form.Item name="comparator" label="條件" rules={[{ required: true }]}>
            <Select options={COMPARATORS} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="threshold" label="門檻" rules={[{ required: true }]}>
            <InputNumber style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="notify" label="通知" rules={[{ required: true }]}>
            <Select options={NOTIFY} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                新增
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="已建立的監測規則">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rules}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
