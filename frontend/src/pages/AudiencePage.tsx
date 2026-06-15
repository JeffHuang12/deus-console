import { useEffect, useState } from "react";
import { Button, Popconfirm, Space, Table, Tag, message } from "antd";
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
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/audience/new")}>
          新建受眾
        </Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={audiences} pagination={false} />
    </div>
  );
}
