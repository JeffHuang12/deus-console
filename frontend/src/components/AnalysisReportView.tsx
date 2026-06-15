import { Alert, Col, List, Row, Statistic, Table, Tag, Typography } from "antd";
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
import SectionCard from "./SectionCard";
import type { AnalysisReport, DayHighlight } from "../api/types";

const { Paragraph, Text } = Typography;

// 分析報告八區塊渲染器。供報表詳情頁 /analysis/:id 重用。
export default function AnalysisReportView({ report }: { report: AnalysisReport }) {
  const highlightColumns = [
    { title: "日期", dataIndex: "date", key: "date" },
    { title: "指標", dataIndex: "metric", key: "metric" },
    { title: "數值", dataIndex: "value", key: "value" },
    {
      title: "類型",
      dataIndex: "kind",
      key: "kind",
      render: (k: DayHighlight["kind"]) =>
        k === "best" ? (
          <Tag color="green">表現優異</Tag>
        ) : (
          <Tag color="red">異常</Tag>
        ),
    },
    { title: "說明", dataIndex: "note", key: "note" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Tag color="geekblue">日期範圍：{report.range_label}</Tag>
        <Tag color="purple">{report.compare_label}</Tag>
      </div>

      <SectionCard index={0} title="執行摘要">
        <Paragraph>{report.executive_summary}</Paragraph>
      </SectionCard>

      <SectionCard
        index={1}
        title="整體數據總覽"
        extra={<Text type="secondary">{report.compare_label}</Text>}
      >
        <Row gutter={[16, 16]}>
          {report.kpis.map((k) => (
            <Col xs={12} md={8} key={k.label}>
              <Statistic
                title={k.label}
                value={k.value}
                valueStyle={{ fontSize: 20 }}
                suffix={
                  k.delta_pct != null ? (
                    <span
                      style={{
                        fontSize: 13,
                        color: k.delta_pct >= 0 ? "#3f8600" : "#cf1322",
                      }}
                    >
                      {k.delta_pct >= 0 ? "▲" : "▼"} {Math.abs(k.delta_pct)}%
                    </span>
                  ) : undefined
                }
              />
            </Col>
          ))}
        </Row>
      </SectionCard>

      <SectionCard index={2} title="漏斗轉換分析與觀察">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={report.funnel} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="stage" width={90} />
            <Tooltip />
            <Bar dataKey="value" fill="#1677ff" />
          </BarChart>
        </ResponsiveContainer>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="觀察"
          description={report.funnel_observation}
        />
      </SectionCard>

      <SectionCard index={3} title="日常表現波動分析">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={report.daily_fluctuation}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#1677ff" dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="觀察"
          description={report.fluctuation_observation}
        />
      </SectionCard>

      <SectionCard index={4} title="表現優異 VS 異常日期">
        <Table
          rowKey={(r) => `${r.date}-${r.metric}`}
          columns={highlightColumns}
          dataSource={report.highlights}
          pagination={false}
          size="small"
        />
      </SectionCard>

      <SectionCard index={5} title="趨勢觀察">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={report.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#52c41a" dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="觀察"
          description={report.trend_observation}
        />
      </SectionCard>

      <SectionCard index={6} title="具體優化建議">
        <List
          dataSource={report.recommendations}
          renderItem={(item, i) => (
            <List.Item>
              <Typography.Text>
                {i + 1}. {item}
              </Typography.Text>
            </List.Item>
          )}
        />
      </SectionCard>

      <SectionCard index={7} title="總結">
        <Paragraph>{report.conclusion}</Paragraph>
      </SectionCard>
    </div>
  );
}
