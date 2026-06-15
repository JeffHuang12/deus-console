import { useEffect, useState } from "react";
import { Button, Card, Col, Popconfirm, Row, Space, Tag, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type { Report } from "../api/types";

const { Text } = Typography;

const SOURCE_COLOR: Record<string, string> = {
  Meta: "blue",
  Google: "green",
  GA4: "orange",
};

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);

  const reload = () => api.getReports().then(setReports);

  useEffect(() => {
    reload();
  }, []);

  const run = async (id: string) => {
    setRunningId(id);
    try {
      await api.runReport(id);
      message.success("已重新執行");
      reload();
    } finally {
      setRunningId(null);
    }
  };

  const remove = async (id: string) => {
    await api.deleteReport(id);
    message.success("已刪除");
    reload();
  };

  return (
    <div>
      <PageHeader
        title="分析中心"
        description="管理已建立的分析報表。可新建報表、查看詳情、重新執行或刪除。本期資料為示範值。"
      />

      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/analysis/new")}>
          新建報表
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {reports.map((r) => (
          <Col xs={24} sm={12} lg={8} key={r.id}>
            <Card
              title={r.name}
              extra={<Tag>{r.frequency}</Tag>}
              actions={[
                <a key="view" onClick={() => navigate(`/analysis/${r.id}`)}>
                  查看
                </a>,
                <a
                  key="run"
                  onClick={() => runningId === null && run(r.id)}
                  style={{ color: runningId === r.id ? "#999" : undefined }}
                >
                  {runningId === r.id ? "執行中…" : "執行"}
                </a>,
                <Popconfirm key="del" title="確認刪除這份報表?" onConfirm={() => remove(r.id)}>
                  <a style={{ color: "#cf1322" }}>刪除</a>
                </Popconfirm>,
              ]}
            >
              <Space direction="vertical" size={8}>
                <div>
                  {r.sources.map((s) => (
                    <Tag color={SOURCE_COLOR[s] ?? "default"} key={s}>
                      {s}
                    </Tag>
                  ))}
                </div>
                <Text type="secondary">最後更新:{r.updated_at}</Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
