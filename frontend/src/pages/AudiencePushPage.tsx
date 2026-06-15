import { useEffect, useState } from "react";
import {
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Radio,
  Select,
  Space,
  TimePicker,
  message,
} from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Dayjs } from "dayjs";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import { PUSH_PLATFORMS, PUSH_TEMPLATES } from "../api/audienceMeta";
import type { Audience, PushPayload } from "../api/types";

const FREQ = ["每日", "每週", "每月"].map((v) => ({ label: v, value: v }));

export default function AudiencePushPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience | null>(null);

  const [mode, setMode] = useState<"once" | "recurring">("once");
  const [onceAt, setOnceAt] = useState<Dayjs | null>(null);
  const [freq, setFreq] = useState("每日");
  const [time, setTime] = useState<Dayjs | null>(null);
  const [platform, setPlatform] = useState<"edm" | "sms" | "line">("edm");
  const [contentMode, setContentMode] = useState<"template" | "custom">("template");
  const [template, setTemplate] = useState<string>();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.getAudience(id).then(setAudience);
  }, [id]);

  const submit = async () => {
    const schedule =
      mode === "once"
        ? onceAt
          ? onceAt.format("YYYY-MM-DD HH:mm")
          : ""
        : `${freq} ${time ? time.format("HH:mm") : ""}`;
    if (!schedule.trim()) {
      message.warning("請選擇推送時間");
      return;
    }
    if (contentMode === "template" && !template) {
      message.warning("請選擇範本");
      return;
    }
    if (contentMode === "custom" && !body.trim()) {
      message.warning("請輸入內文");
      return;
    }
    const payload: PushPayload = {
      mode,
      schedule,
      platform,
      content_mode: contentMode,
      template: contentMode === "template" ? template : undefined,
      subject: contentMode === "custom" && platform === "edm" ? subject : undefined,
      body: contentMode === "custom" ? body : undefined,
    };
    setSending(true);
    try {
      await api.sendPush(id, payload);
      message.success(mode === "once" ? "已排定單次推播" : "已建立定期推播");
      navigate("/audience");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to="/audience">受眾管理</Link> },
          { title: audience?.name ?? "受眾" },
          { title: "推播" },
        ]}
      />
      <PageHeader
        title={audience ? `${audience.name} — 推播` : "推播"}
        description="設定推播時間、平台與內容。本期不實際發送,實際串接於 Phase 2。"
      />

      <Card style={{ maxWidth: 680 }}>
        <Form layout="vertical">
          <Form.Item label="推播方式">
            <Radio.Group
              optionType="button"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              options={[
                { label: "單次", value: "once" },
                { label: "定期", value: "recurring" },
              ]}
            />
          </Form.Item>

          {mode === "once" ? (
            <Form.Item label="推送時間">
              <DatePicker showTime value={onceAt} onChange={setOnceAt} style={{ width: "100%" }} />
            </Form.Item>
          ) : (
            <Form.Item label="推送時間">
              <Space>
                <Select options={FREQ} value={freq} onChange={setFreq} style={{ width: 120 }} />
                <TimePicker format="HH:mm" value={time} onChange={setTime} />
              </Space>
            </Form.Item>
          )}

          <Form.Item label="推送平台">
            <Radio.Group
              optionType="button"
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                setTemplate(undefined);
              }}
              options={PUSH_PLATFORMS}
            />
          </Form.Item>

          <Form.Item label="內容">
            <Radio.Group
              value={contentMode}
              onChange={(e) => setContentMode(e.target.value)}
              style={{ marginBottom: 12 }}
              options={[
                { label: "選擇範本", value: "template" },
                { label: "自行撰寫", value: "custom" },
              ]}
            />
            {contentMode === "template" ? (
              <Select
                style={{ width: "100%" }}
                placeholder="選擇範本"
                value={template}
                onChange={setTemplate}
                options={PUSH_TEMPLATES[platform]}
              />
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                {platform === "edm" && (
                  <Input
                    placeholder="主旨"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                )}
                <Input.TextArea
                  rows={4}
                  placeholder="內文"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </Space>
            )}
          </Form.Item>

          <Space>
            <Button type="primary" loading={sending} onClick={submit}>
              送出推播
            </Button>
            <Button onClick={() => navigate("/audience")}>取消</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
