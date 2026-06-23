import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { api } from "../api/client";
import { GA4_DEFAULT_MODEL, GA4_MODELS } from "../api/presets";
import type { Ga4HistoryEntry, Ga4QueryResponse } from "../api/types";

const { Paragraph, Text } = Typography;

// 模型 value → 簡短標籤(歷史清單用)
const MODEL_SHORT: Record<string, string> = {
  "claude-haiku-4-5-20251001": "Haiku",
  "claude-sonnet-4-6": "Sonnet",
  "claude-opus-4-8": "Opus",
  "gemini-2.5-flash": "Gemini Flash",
  "gemini-2.5-pro": "Gemini Pro",
};

const SAMPLES = [
  "過去 7 天每天的工作階段數",
  "昨天的活躍使用者與轉換數",
  "上週各裝置類別的工作階段",
  "現在線上的活躍使用者",
];

const COLORS = ["#1677ff", "#52c41a", "#faad14", "#eb2f96", "#13c2c2"];

export default function Ga4QueryPage() {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(GA4_DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Ga4QueryResponse | null>(null);
  const [history, setHistory] = useState<Ga4HistoryEntry[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    api.getGa4History().then(setHistory).catch(() => setHistory([]));
  }, []);

  const run = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setRes(null);
    setViewingId(null);
    try {
      const data = await api.queryGa4(text, model);
      setRes(data);
      try {
        const entry = await api.saveGa4History(text, data, model);
        setHistory((prev) => [entry, ...prev]);
        setViewingId(entry.id);
      } catch {
        // 存歷史失敗不影響本次結果顯示
      }
    } catch {
      setRes(null);
    } finally {
      setLoading(false);
    }
  };

  const viewEntry = (entry: Ga4HistoryEntry) => {
    setRes(entry);
    setViewingId(entry.id);
    setInput(entry.text);
    if (entry.model) setModel(entry.model);
  };

  const removeEntry = async (id: string) => {
    await api.deleteGa4History(id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
    if (viewingId === id) {
      setRes(null);
      setViewingId(null);
    }
  };

  const clearAll = async () => {
    await api.clearGa4History();
    setHistory([]);
    setRes(null);
    setViewingId(null);
  };

  const table = res?.table ?? null;
  const chart = res?.chart ?? null;

  const columns =
    table?.columns.map((col) => {
      const isMetric = table.metric_types?.[col] != null;
      return {
        title: col,
        dataIndex: col,
        render: (v: string) =>
          isMetric && v !== "" && !Number.isNaN(Number(v))
            ? Number(v).toLocaleString("en-US")
            : v,
      };
    }) ?? [];

  const chartData = (() => {
    if (!chart || !table) return [];
    const points = table.rows.map((r) => {
      const point: Record<string, string | number> = { [chart.x]: r[chart.x] };
      chart.series.forEach((s) => {
        point[s] = Number(r[s] ?? 0);
      });
      return point;
    });
    // x 軸是日期時(YYYYMMDD 或含 -),依日期排序,避免模型按指標排序導致折線亂序。
    const isDateX = points.every((p) => /^\d{8}$|-/.test(String(p[chart.x])));
    if (isDateX) {
      points.sort((a, b) => String(a[chart.x]).localeCompare(String(b[chart.x])));
    }
    return points;
  })();

  return (
    <div>
      <PageHeader
        title="GA4 查詢"
        description="用一句話查 Google Analytics 4。背後由 Claude 透過 GA4 MCP 自動選維度指標查詢,回傳文字、表格與圖表。查詢會自動存進左側歷史,可隨時回看。"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={7}>
          <Card
            title="查詢歷史"
            size="small"
            styles={{ body: { maxHeight: 560, overflowY: "auto", padding: 8 } }}
            extra={
              history.length > 0 && (
                <Popconfirm
                  title="清除全部歷史?"
                  onConfirm={clearAll}
                  okText="清除"
                  cancelText="取消"
                >
                  <Button type="link" size="small" danger>
                    清除全部
                  </Button>
                </Popconfirm>
              )
            }
          >
            <List
              dataSource={history}
              locale={{ emptyText: "尚無查詢紀錄" }}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: "pointer",
                    padding: "8px 8px",
                    borderRadius: 6,
                    background: item.id === viewingId ? "#e6f4ff" : undefined,
                  }}
                  onClick={() => viewEntry(item)}
                  actions={[
                    <Button
                      key="del"
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEntry(item.id);
                      }}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Text ellipsis style={{ maxWidth: 180 }}>
                        {item.text}
                      </Text>
                    }
                    description={
                      <Space size={4} wrap>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.created_at).format("MM/DD HH:mm")}
                        </Text>
                        {item.error ? (
                          <Tag color="warning">無資料</Tag>
                        ) : (
                          item.table && <Tag color="blue">{item.table.rows.length} 列</Tag>
                        )}
                        {item.model && (
                          <Tag>{MODEL_SHORT[item.model] ?? item.model}</Tag>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={17}>
          <Space style={{ marginBottom: 12 }}>
            <Text type="secondary">模型</Text>
            <Select
              value={model}
              onChange={setModel}
              options={GA4_MODELS}
              style={{ width: 220 }}
              disabled={loading}
            />
          </Space>

          <Space.Compact style={{ width: "100%", marginBottom: 12 }}>
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例如:過去 7 天每天的工作階段數"
              autoSize={{ minRows: 1, maxRows: 4 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  run();
                }
              }}
            />
            <Button type="primary" loading={loading} onClick={run}>
              查詢
            </Button>
          </Space.Compact>

          <Space wrap style={{ marginBottom: 16 }}>
            {SAMPLES.map((s) => (
              <Button key={s} size="small" onClick={() => setInput(s)} disabled={loading}>
                {s}
              </Button>
            ))}
          </Space>

          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Spin size="large" tip="查詢中,GA4 agent 可能需要數秒…">
                <div style={{ height: 1 }} />
              </Spin>
            </div>
          )}

          {!loading && !res && (
            <Empty
              style={{ paddingTop: 48 }}
              description="輸入問題查詢,或點左側歷史回看之前的報表"
            />
          )}

          {!loading && res && (
            <>
              {res.error && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="查詢提示"
                  description={res.error}
                />
              )}

              <SectionCard index={1} title="分析說明">
                <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                  {res.narrative}
                </Paragraph>
              </SectionCard>

              {chart && chartData.length > 0 && (
                <SectionCard index={2} title="圖表">
                  <ResponsiveContainer width="100%" height={300}>
                    {chart.type === "bar" ? (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={chart.x} />
                        <YAxis />
                        <Tooltip />
                        {chart.series.map((s, i) => (
                          <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </BarChart>
                    ) : (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={chart.x} />
                        <YAxis />
                        <Tooltip />
                        {chart.series.map((s, i) => (
                          <Line
                            key={s}
                            type="monotone"
                            dataKey={s}
                            stroke={COLORS[i % COLORS.length]}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </SectionCard>
              )}

              {table && table.rows.length > 0 ? (
                <SectionCard index={chart ? 3 : 2} title="資料表">
                  <Table
                    rowKey={(_, idx) => String(idx)}
                    size="small"
                    pagination={{ pageSize: 20, hideOnSinglePage: true }}
                    scroll={{ x: "max-content" }}
                    dataSource={table.rows}
                    columns={columns}
                  />
                </SectionCard>
              ) : (
                !res.error && (
                  <SectionCard index={chart ? 3 : 2} title="資料表">
                    <Empty description="此查詢沒有表格資料" />
                  </SectionCard>
                )
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}
