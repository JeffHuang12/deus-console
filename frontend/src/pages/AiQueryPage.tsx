import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { api } from "../api/client";
import { GA4_DEFAULT_MODEL, GA4_MODELS } from "../api/presets";
import type { AiQuerySource, Ga4QueryResponse } from "../api/types";

const { Text } = Typography;

const SOURCES: { value: AiQuerySource; label: string }[] = [
  { value: "cross", label: "跨平台彙整" },
  { value: "ga4", label: "GA4" },
  { value: "google_ads", label: "Google Ads" },
  { value: "meta_ads", label: "Meta 廣告" },
  { value: "search_console", label: "Search Console" },
];

const SAMPLES: Record<AiQuerySource, string[]> = {
  cross: ["各渠道這週的真實 ROAS 排名", "哪個平台的新客成本最高"],
  ga4: ["過去 7 天的工作階段趨勢", "本月轉換率最高的流量來源"],
  google_ads: ["這週各廣告活動的 ROAS", "哪些字成本高但沒轉換"],
  meta_ads: ["哪個廣告組 CTR 在下滑", "再行銷與新客的成效比較"],
  search_console: ["曝光高但點擊率低的搜尋字", "過去 28 天點擊最高的查詢"],
};

export default function AiQueryPage() {
  const [source, setSource] = useState<AiQuerySource>("cross");
  const [model, setModel] = useState(GA4_DEFAULT_MODEL);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Ga4QueryResponse | null>(null);

  const run = async (q?: string) => {
    const query = (q ?? text).trim();
    if (!query) return;
    setText(query);
    setLoading(true);
    setRes(null);
    try {
      setRes(await api.queryMcp(source, query, model));
    } finally {
      setLoading(false);
    }
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

  const chartData =
    chart && table
      ? table.rows.map((r) => {
          const point: Record<string, string | number> = { [chart.x]: r[chart.x] };
          chart.series.forEach((s) => (point[s] = Number(r[s] ?? 0)));
          return point;
        })
      : [];

  return (
    <div>
      <PageHeader
        title="AI 資料查詢"
        description="用一句話查各資料源。背後由模型透過官方 MCP 自動選維度指標查詢,回傳文字、表格與圖表。選來源後輸入問題即可。本期為示範資料。"
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 12 }}>
          <Text>來源：</Text>
          <Select
            style={{ width: 160 }}
            value={source}
            onChange={(v) => {
              setSource(v);
              setRes(null);
            }}
            options={SOURCES}
          />
          <Text>模型：</Text>
          <Select
            style={{ width: 220 }}
            value={model}
            onChange={setModel}
            options={GA4_MODELS}
          />
          {source === "ga4" && (
            <Link to="/ga4-query">開啟 GA4 進階（含查詢歷史）</Link>
          )}
        </Space>

        <Space.Compact style={{ width: "100%" }}>
          <Input.TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="輸入你的問題"
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                run();
              }
            }}
          />
          <Button type="primary" loading={loading} onClick={() => run()}>
            查詢
          </Button>
        </Space.Compact>

        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ marginRight: 8 }}>
            範例：
          </Text>
          {SAMPLES[source].map((s) => (
            <Tag
              key={s}
              color="processing"
              style={{ cursor: "pointer", marginBottom: 4 }}
              onClick={() => run(s)}
            >
              {s}
            </Tag>
          ))}
        </div>
      </Card>

      {loading && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Spin />
          <Text type="secondary" style={{ marginLeft: 12 }}>
            查詢中…
          </Text>
        </div>
      )}

      {res && (
        <>
          {res.error && (
            <Alert type="warning" showIcon style={{ marginBottom: 16 }} message={res.error} />
          )}
          <SectionCard index={1} title="分析說明">
            <Text style={{ whiteSpace: "pre-wrap" }}>{res.narrative}</Text>
          </SectionCard>

          {chart && chartData.length > 0 && (
            <SectionCard index={2} title="圖表">
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chart.type === "bar" ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={chart.x} />
                      <YAxis />
                      <RTooltip />
                      {chart.series.map((s) => (
                        <Bar key={s} dataKey={s} fill="#1677ff" />
                      ))}
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={chart.x} />
                      <YAxis />
                      <RTooltip />
                      {chart.series.map((s) => (
                        <Line key={s} type="monotone" dataKey={s} stroke="#1677ff" />
                      ))}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </SectionCard>
          )}

          {table && (
            <SectionCard index={chart ? 3 : 2} title="資料表">
              <Table
                rowKey={(r) => Object.values(r).join("|")}
                size="small"
                pagination={false}
                dataSource={table.rows}
                columns={columns}
                scroll={{ x: "max-content" }}
              />
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
