import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  List,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { api } from "../api/client";
import type {
  Conversation,
  ConversationDetail,
  Sentiment,
} from "../api/types";

const { Text, Paragraph } = Typography;

const SENTIMENT: Record<Sentiment, { label: string; color: string }> = {
  positive: { label: "正面", color: "green" },
  neutral: { label: "中性", color: "default" },
  negative: { label: "負面", color: "red" },
};

const SEVERITY_LABEL: Record<string, string> = {
  low: "低",
  mid: "中",
  high: "高",
};

const CHANNEL_LABEL: Record<string, string> = {
  line: "LINE",
  messenger: "Messenger",
};

export default function ConversationsPage() {
  const [list, setList] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    api.getConversations().then((cs) => {
      setList(cs);
      if (cs.length) setSelected(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (selected)
      api.getConversation(selected).then((d) => {
        setDetail(d);
        setDraft(d.draft_reply);
      });
  }, [selected]);

  return (
    <div>
      <PageHeader
        title="客服對話中心"
        description="彙整 LINE 與 Messenger 對話，由 AI 自動標籤、生成三行摘要、判斷客訴嚴重度與派工，並提供可編輯的回覆草稿。本期為示範資料。"
      />

      <Row gutter={16}>
        <Col xs={24} lg={9}>
          <Card title="對話列表" size="small">
            <List<Conversation>
              dataSource={list}
              renderItem={(c) => (
                <List.Item
                  onClick={() => setSelected(c.id)}
                  style={{
                    cursor: "pointer",
                    background: c.id === selected ? "#e6f4ff" : undefined,
                    paddingInline: 12,
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{c.customer}</Text>
                        <Tag>{CHANNEL_LABEL[c.channel]}</Tag>
                        <Tag color={SENTIMENT[c.sentiment].color}>
                          {SENTIMENT[c.sentiment].label}
                        </Tag>
                        {c.escalated && <Tag color="volcano">已升級</Tag>}
                      </Space>
                    }
                    description={c.last_message}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={15}>
          {detail && (
            <>
              <SectionCard
                index={1}
                title={`對話詳情：${detail.customer}`}
                extra={
                  <Space>
                    {detail.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </Space>
                }
              >
                <List<ConversationDetail["messages"][number]>
                  dataSource={detail.messages}
                  renderItem={(m) => (
                    <List.Item style={{ paddingInline: 0 }}>
                      <List.Item.Meta
                        title={
                          <Text type={m.role === "agent" ? "success" : undefined}>
                            {m.role === "agent" ? "客服" : "客戶"}
                            <Text type="secondary" style={{ fontWeight: 400, marginLeft: 8 }}>
                              {m.at}
                            </Text>
                          </Text>
                        }
                        description={m.text}
                      />
                    </List.Item>
                  )}
                />
              </SectionCard>

              <SectionCard index={2} title="AI 摘要與派工">
                <Alert
                  type={detail.severity === "high" ? "error" : "info"}
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={`客訴嚴重度：${SEVERITY_LABEL[detail.severity]}　建議派工：${detail.route_to}`}
                />
                <Paragraph style={{ marginBottom: 4 }}>
                  <Text strong>三行摘要</Text>
                </Paragraph>
                <ul style={{ marginTop: 0 }}>
                  {detail.summary.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard index={3} title="AI 回覆草稿（可編輯）">
                <Input.TextArea
                  rows={4}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div style={{ marginTop: 12, textAlign: "right" }}>
                  <Button
                    type="primary"
                    onClick={() => message.success("已送出（示範）")}
                  >
                    送出回覆
                  </Button>
                </div>
              </SectionCard>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}
