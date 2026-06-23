import { useEffect, useState } from "react";
import { Button, Popconfirm, Space, Switch, Table, Tabs, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type { Audience } from "../api/types";

const CHANNEL_LABEL: Record<string, string> = {
  edm: "EDM",
  meta: "Meta",
  google: "Google",
  line: "LINE",
};

// 推播旅程範本：以事件觸發的多步序列(承接 A×D / B×D 自動化)。本期為示範。
interface Journey {
  key: string;
  name: string;
  trigger: string;
  steps: string;
  channels: string[];
  enabled: boolean;
}

const JOURNEYS: Journey[] = [
  { key: "abandon", name: "棄單挽回", trigger: "結帳未完成", steps: "1 小時 LINE → 24 小時 EDM", channels: ["line", "edm"], enabled: true },
  { key: "repurchase", name: "回購提醒", trigger: "達品項回購週期前 7 天", steps: "LINE 提醒 → 未動作補 EDM", channels: ["line", "edm"], enabled: true },
  { key: "onboarding", name: "首購後序列", trigger: "首次購買", steps: "第 3/7/14/30 天分別發教育、好評、優惠", channels: ["edm", "line"], enabled: true },
  { key: "winback", name: "流失客喚回", trigger: "超回購週期 1.5 倍未購", steps: "教育內容 → 社群好評 → 折扣券", channels: ["edm"], enabled: false },
  { key: "backinstock", name: "缺貨候補通知", trigger: "候補商品到貨", steps: "即時 LINE 推播附下單連結", channels: ["line"], enabled: true },
  { key: "birthday", name: "生日/紀念日", trigger: "CRM 日期欄位", steps: "當日 LINE 祝福附優惠券", channels: ["line"], enabled: true },
];

export default function AudiencePage() {
  const navigate = useNavigate();
  const [audiences, setAudiences] = useState<Audience[]>([]);

  const reload = () => api.getAudiences().then(setAudiences);

  useEffect(() => {
    reload();
  }, []);

  const remove = async (id: string) => {
    await api.deleteAudience(id);
    message.success("已刪除");
    reload();
  };

  const columns = [
    {
      title: "名稱",
      dataIndex: "name",
      render: (name: string, a: Audience) => (
        <Link to={`/audience/${a.id}/report`}>{name}</Link>
      ),
    },
    {
      title: "建立方式",
      dataIndex: "method",
      render: (m: Audience["method"]) => {
        const map: Record<Audience["method"], { color: string; label: string }> = {
          natural_language: { color: "purple", label: "自然語言" },
          structured: { color: "blue", label: "結構化條件" },
          smart_segment: { color: "green", label: "智慧分群" },
          rfm: { color: "gold", label: "RFM 智慧分群" },
        };
        const t = map[m];
        return <Tag color={t.color}>{t.label}</Tag>;
      },
    },
    {
      title: "人數",
      dataIndex: "count",
      render: (n: number) => n.toLocaleString("en-US"),
    },
    { title: "建立時間", dataIndex: "created_at" },
    { title: "更新頻率", dataIndex: "frequency" },
    {
      title: "連接通路",
      dataIndex: "channels",
      render: (channels: string[]) =>
        channels.length === 0 ? (
          <Tag>未連接</Tag>
        ) : (
          channels.map((c) => <Tag key={c}>{CHANNEL_LABEL[c] ?? c}</Tag>)
        ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, a: Audience) => (
        <Space>
          <a onClick={() => navigate(`/audience/${a.id}/ad-build`)}>廣告受眾建立</a>
          <a onClick={() => navigate(`/audience/${a.id}/push`)}>推播</a>
          <a onClick={() => navigate(`/audience/${a.id}/report`)}>查看報表</a>
          <Popconfirm title="確認刪除這個受眾?" onConfirm={() => remove(a.id)}>
            <a style={{ color: "#cf1322" }}>刪除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="受眾管理"
        description="以自然語言或結構化條件建立受眾,設定更新頻率與連接通路。本期人數為示範值。"
      />
      <Tabs
        defaultActiveKey="list"
        items={[
          {
            key: "list",
            label: "受眾清單",
            children: (
              <>
                <div style={{ marginBottom: 16, textAlign: "right" }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/audience/new")}
                  >
                    新建受眾
                  </Button>
                </div>
                <Table rowKey="id" columns={columns} dataSource={audiences} pagination={false} />
              </>
            ),
          },
          {
            key: "journey",
            label: "推播旅程",
            children: (
              <Table<Journey>
                rowKey="key"
                pagination={false}
                dataSource={JOURNEYS}
                columns={[
                  { title: "旅程名稱", dataIndex: "name" },
                  { title: "觸發條件", dataIndex: "trigger" },
                  { title: "步驟", dataIndex: "steps" },
                  {
                    title: "通路",
                    dataIndex: "channels",
                    render: (cs: string[]) => cs.map((c) => <Tag key={c}>{CHANNEL_LABEL[c] ?? c}</Tag>),
                  },
                  {
                    title: "啟用",
                    dataIndex: "enabled",
                    render: (v: boolean) => <Switch defaultChecked={v} />,
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
