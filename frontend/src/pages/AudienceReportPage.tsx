import { useEffect, useState } from "react";
import { Breadcrumb, Card, Col, DatePicker, Row, Spin, Statistic, Table } from "antd";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { api } from "../api/client";
import type { Audience, AudienceReport } from "../api/types";

const { RangePicker } = DatePicker;

export default function AudienceReportPage() {
  const { id = "" } = useParams();
  const [audience, setAudience] = useState<Audience | null>(null);
  const [report, setReport] = useState<AudienceReport | null>(null);

  useEffect(() => {
    api.getAudience(id).then(setAudience);
    api.getAudienceReport(id).then(setReport);
  }, [id]);

  const kpis = report
    ? [
        { label: "發信數量", value: report.sent.toLocaleString("en-US") },
        { label: "開信率", value: `${report.open_rate}%` },
        { label: "點擊率", value: `${report.click_rate}%` },
        { label: "發送失敗率", value: `${report.fail_rate}%` },
        { label: "退訂率", value: `${report.unsubscribe_rate}%` },
        { label: "退信率", value: `${report.bounce_rate}%` },
        { label: "銷售額", value: `NT$ ${report.sales.toLocaleString("en-US")}` },
      ]
    : [];

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to="/audience">受眾管理</Link> },
          { title: audience?.name ?? "受眾" },
          { title: "查看報表" },
        ]}
      />
      <PageHeader
        title={audience ? `${audience.name} — 推播報表` : "推播報表"}
        description="依日期檢視推播成效。本期數據為示範值。"
      />

      <div style={{ marginBottom: 16 }}>
        <RangePicker />
      </div>

      {!report ? (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {kpis.map((k) => (
              <Col xs={12} md={6} key={k.label}>
                <Card size="small">
                  <Statistic title={k.label} value={k.value} valueStyle={{ fontSize: 18 }} />
                </Card>
              </Col>
            ))}
          </Row>

          <SectionCard index={1} title="每日趨勢(發信數量)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={report.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sent" stroke="#1677ff" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard index={2} title="每日明細">
            <Table
              rowKey="date"
              size="small"
              pagination={false}
              scroll={{ x: "max-content" }}
              dataSource={report.daily}
              columns={[
                { title: "日期", dataIndex: "date" },
                { title: "發信數量", dataIndex: "sent", render: (n: number) => n.toLocaleString("en-US") },
                { title: "開信率", dataIndex: "open_rate", render: (n: number) => `${n}%` },
                { title: "點擊率", dataIndex: "click_rate", render: (n: number) => `${n}%` },
                { title: "發送失敗率", dataIndex: "fail_rate", render: (n: number) => `${n}%` },
                { title: "退訂率", dataIndex: "unsubscribe_rate", render: (n: number) => `${n}%` },
                { title: "退信率", dataIndex: "bounce_rate", render: (n: number) => `${n}%` },
                { title: "銷售額", dataIndex: "sales", render: (n: number) => `NT$ ${n.toLocaleString("en-US")}` },
              ]}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}
