import { useEffect, useState } from "react";
import { Alert, Card, Segmented, Select, Space, Table, Tag, Typography } from "antd";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { api } from "../api/client";
import type {
  CreativeFatigueData,
  CreativeRow,
  FatigueCompare,
  FatigueRange,
} from "../api/types";

const { Text } = Typography;

const OBJECTIVES = ["轉換", "流量", "觸及", "互動"];
const PLACEMENTS = ["動態消息", "限時動態", "搜尋", "多媒體", "購物", "聊天列表", "貼文串"];
const PLATFORMS = ["Meta", "Google", "LINE"];

const STATUS: Record<CreativeRow["status"], { label: string; color: string }> = {
  healthy: { label: "健康", color: "green" },
  watch: { label: "觀察", color: "gold" },
  fatigued: { label: "疲勞", color: "red" },
};

export default function CreativeFatiguePage() {
  const [range, setRange] = useState<FatigueRange>("30d");
  const [compare, setCompare] = useState<FatigueCompare>("prev_period");
  const [objective, setObjective] = useState<string>();
  const [placement, setPlacement] = useState<string>();
  const [platform, setPlatform] = useState<string>();
  const [data, setData] = useState<CreativeFatigueData | null>(null);

  useEffect(() => {
    api
      .getCreativeFatigue({ range, compare, objective, placement, platform })
      .then(setData);
  }, [range, compare, objective, placement, platform]);

  return (
    <div>
      <PageHeader
        title="素材疲勞偵測"
        description="跨 Meta／Google／LINE 比較各素材的成效趨勢,偵測 CTR 衰退中的疲勞素材並提示汰換。本期為示範資料。"
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="large">
          <Space>
            <Text>廣告平台：</Text>
            <Select
              allowClear
              placeholder="全部平台"
              style={{ width: 140 }}
              value={platform}
              onChange={setPlatform}
              options={PLATFORMS.map((p) => ({ label: p, value: p }))}
            />
          </Space>
          <Space>
            <Text>廣告活動目標：</Text>
            <Select
              allowClear
              placeholder="全部目標"
              style={{ width: 140 }}
              value={objective}
              onChange={setObjective}
              options={OBJECTIVES.map((o) => ({ label: o, value: o }))}
            />
          </Space>
          <Space>
            <Text>廣告版位：</Text>
            <Select
              allowClear
              placeholder="全部版位"
              style={{ width: 140 }}
              value={placement}
              onChange={setPlacement}
              options={PLACEMENTS.map((p) => ({ label: p, value: p }))}
            />
          </Space>
        </Space>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="large">
          <Space>
            <Text>時間範圍：</Text>
            <Segmented
              value={range}
              onChange={(v) => setRange(v as FatigueRange)}
              options={[
                { label: "過去 7 天", value: "7d" },
                { label: "過去 30 天", value: "30d" },
                { label: "過去半年", value: "6m" },
              ]}
            />
          </Space>
          <Space>
            <Text>比較對象：</Text>
            <Segmented
              value={compare}
              onChange={(v) => setCompare(v as FatigueCompare)}
              options={[
                { label: "前一段時間", value: "prev_period" },
                { label: "前一年同期", value: "prev_year" },
              ]}
            />
          </Space>
        </Space>
      </Card>

      {data && (
        <>
          <SectionCard index={1} title="CTR 趨勢（本期 vs 比較期）">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <RTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="current" stroke="#1677ff" name="本期 CTR (%)" />
                  <Line
                    type="monotone"
                    dataKey="compare"
                    stroke="#bfbfbf"
                    name={compare === "prev_year" ? "去年同期 (%)" : "前一段時間 (%)"}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard index={2} title="AI 統整">
            <Alert type="info" showIcon message="疲勞偵測摘要" description={data.summary} />
          </SectionCard>

          <SectionCard index={3} title="各素材表現">
            <Table<CreativeRow>
              rowKey="creative"
              size="small"
              pagination={false}
              dataSource={data.creatives}
              columns={[
                { title: "素材", dataIndex: "creative" },
                { title: "平台", dataIndex: "platform", render: (v: string) => <Tag>{v}</Tag> },
                { title: "目標", dataIndex: "objective" },
                { title: "版位", dataIndex: "placement" },
                {
                  title: "CTR (%)",
                  dataIndex: "ctr",
                  sorter: (a, b) => a.ctr - b.ctr,
                },
                {
                  title: "與比較期",
                  dataIndex: "ctr_delta",
                  sorter: (a, b) => a.ctr_delta - b.ctr_delta,
                  render: (v: number) => (
                    <Text style={{ color: v >= 0 ? "#52c41a" : "#cf1322" }}>
                      {v > 0 ? "+" : ""}
                      {v}%
                    </Text>
                  ),
                },
                {
                  title: "狀態",
                  dataIndex: "status",
                  render: (s: CreativeRow["status"]) => (
                    <Tag color={STATUS[s].color}>{STATUS[s].label}</Tag>
                  ),
                },
              ]}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}
