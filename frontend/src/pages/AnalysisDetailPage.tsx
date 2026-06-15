import { useEffect, useState } from "react";
import { Breadcrumb, Button, Card, DatePicker, Input, Space, Spin, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import AnalysisReportView from "../components/AnalysisReportView";
import { api } from "../api/client";
import type { ReportDetail } from "../api/types";

export default function AnalysisDetailPage() {
  const { id = "" } = useParams();
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [running, setRunning] = useState(false);

  // 報表 Prompt 檢視 / 編輯
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);

  const load = () => api.getReport(id).then(setDetail);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const run = async () => {
    setRunning(true);
    try {
      await api.runReport(id);
      await load();
      message.success("已重新執行");
    } finally {
      setRunning(false);
    }
  };

  const startEdit = () => {
    setPromptDraft(detail?.prompt ?? "");
    setEditingPrompt(true);
  };

  const savePrompt = async () => {
    setSavingPrompt(true);
    try {
      const updated = await api.updateReport(id, { prompt: promptDraft.trim() || null });
      setDetail((prev) => (prev ? { ...prev, prompt: updated.prompt } : prev));
      setEditingPrompt(false);
      message.success("已更新 Prompt");
    } finally {
      setSavingPrompt(false);
    }
  };

  if (!detail) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[{ title: <Link to="/analysis">分析中心</Link> }, { title: detail.name }]}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>{detail.name}</h2>
        <Space>
          <DatePicker placeholder="切換日期" />
          <Button type="primary" icon={<ReloadOutlined />} loading={running} onClick={run}>
            執行
          </Button>
        </Space>
      </div>

      <Card
        title="報表 Prompt"
        size="small"
        style={{ marginBottom: 16 }}
        extra={
          editingPrompt ? (
            <Space>
              <Button size="small" onClick={() => setEditingPrompt(false)}>
                取消
              </Button>
              <Button size="small" type="primary" loading={savingPrompt} onClick={savePrompt}>
                儲存
              </Button>
            </Space>
          ) : (
            <Button size="small" onClick={startEdit}>
              編輯
            </Button>
          )
        }
      >
        {editingPrompt ? (
          <Input.TextArea
            rows={6}
            value={promptDraft}
            onChange={(e) => setPromptDraft(e.target.value)}
            placeholder="輸入分析 Prompt"
          />
        ) : detail.prompt ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{detail.prompt}</div>
        ) : (
          <span style={{ color: "#999" }}>建立時未設定 Prompt,點「編輯」可新增。</span>
        )}
      </Card>

      <AnalysisReportView report={detail.sections} />
    </div>
  );
}
