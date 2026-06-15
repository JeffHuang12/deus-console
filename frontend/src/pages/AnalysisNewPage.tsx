import { useState } from "react";
import {
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import type { Dayjs } from "dayjs";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import { MODELS } from "../api/presets";
import { PROMPT_TEMPLATES } from "../api/promptTemplates";
import type { ReportForm, ReportFrequency } from "../api/types";

const { RangePicker } = DatePicker;

const SOURCE_OPTIONS = [
  { label: "Meta 廣告", value: "Meta" },
  { label: "Google Ads", value: "Google" },
  { label: "GA4", value: "GA4" },
];

const FREQUENCY_OPTIONS: { label: string; value: ReportFrequency }[] = [
  { label: "手動", value: "手動" },
  { label: "每日", value: "每日" },
  { label: "每週", value: "每週" },
  { label: "每月", value: "每月" },
];

export default function AnalysisNewPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  // Prompt 用本地狀態控制(避免 form.setFieldValue 觸發 rc-field-form 的循環參照警告)
  const [prompt, setPrompt] = useState("");

  const onFinish = async (values: {
    name: string;
    sources: string[];
    range?: [Dayjs, Dayjs];
    frequency: ReportFrequency;
    model: string;
  }) => {
    const payload: ReportForm = {
      name: values.name,
      sources: values.sources ?? [],
      date_range: values.range
        ? [values.range[0].format("YYYY-MM-DD"), values.range[1].format("YYYY-MM-DD")]
        : null,
      frequency: values.frequency,
      model: values.model,
      prompt: prompt.trim() || null,
    };
    setSubmitting(true);
    try {
      const r = await api.createReport(payload);
      message.success("已建立並執行");
      navigate(`/analysis/${r.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[{ title: <Link to="/analysis">分析中心</Link> }, { title: "新建報表" }]}
      />
      <PageHeader title="新建報表" description="設定報表內容與更新方式,建立後立即執行一次。" />

      <Card>
        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 640 }}
          initialValues={{ frequency: "手動", model: MODELS[0].value }}
          onFinish={onFinish}
        >
          <Form.Item name="name" label="報表名稱" rules={[{ required: true, message: "請輸入報表名稱" }]}>
            <Input placeholder="例如:VITABOX 廣告週報" />
          </Form.Item>

          <Form.Item name="sources" label="資料來源" rules={[{ required: true, message: "請選擇至少一個資料來源" }]}>
            <Select mode="multiple" placeholder="選擇資料來源" options={SOURCE_OPTIONS} />
          </Form.Item>

          <Form.Item name="range" label="日期區間">
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="frequency" label="更新頻率" rules={[{ required: true }]}>
            <Select options={FREQUENCY_OPTIONS} />
          </Form.Item>

          <Form.Item name="model" label="使用模型" rules={[{ required: true }]}>
            <Select options={MODELS} />
          </Form.Item>

          <Form.Item label="範本 Prompt(點擊帶入,可再修改)">
            <Space wrap>
              {PROMPT_TEMPLATES.map((t) => (
                <Tag
                  key={t.key}
                  color="blue"
                  title={t.description}
                  style={{ cursor: "pointer" }}
                  onClick={() => setPrompt(t.body)}
                >
                  {t.title}
                </Tag>
              ))}
            </Space>
          </Form.Item>

          <Form.Item label="自訂 Prompt(選填)">
            <Input.TextArea
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="請特別分析 ROAS 異常的原因,並給出具體建議"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => navigate("/analysis")}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                建立並執行
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
