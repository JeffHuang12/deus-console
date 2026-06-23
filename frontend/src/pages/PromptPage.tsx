import { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Input,
  List,
  Segmented,
  Space,
  Statistic,
  Table,
  Typography,
} from "antd";
import { RobotOutlined, UserOutlined } from "@ant-design/icons";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type { ChatMessage } from "../api/types";

const { Text, Paragraph } = Typography;

type Mode = "chat" | "member";

interface MemberRow {
  member_id: string;
  name: string;
  last_order_at: string;
  ltv: number;
}

// 把自然語言轉成受控 SQL 的示範(Phase 2 由 LLM 生成、限定 schema 白名單後執行)。
function toMemberSql(text: string): string {
  const q = text || "（請輸入條件）";
  return [
    "SELECT member_id, name, last_order_at, ltv",
    "FROM members",
    `WHERE /* 由「${q}」解析 */`,
    "  category = '保健品'",
    "  AND last_order_at < DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)",
    "  AND edm_opened_30d = FALSE",
    "ORDER BY ltv DESC",
    "LIMIT 100",
  ].join("\n");
}

const MEMBER_SAMPLE: MemberRow[] = [
  { member_id: "M-10231", name: "陳O如", last_order_at: "2026-03-02", ltv: 8400 },
  { member_id: "M-10588", name: "王O明", last_order_at: "2026-02-18", ltv: 3150 },
  { member_id: "M-10911", name: "林O婷", last_order_at: "2026-01-27", ltv: 12700 },
];

export default function PromptPage() {
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // 會員查詢模式狀態
  const [memberText, setMemberText] = useState("");
  const [sql, setSql] = useState<string | null>(null);
  const [memberRows, setMemberRows] = useState<MemberRow[]>([]);

  const runMemberQuery = () => {
    setSql(toMemberSql(memberText.trim()));
    setMemberRows(MEMBER_SAMPLE);
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const history = messages;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await api.chat(text, history);
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Prompt 互動"
        description="以對話方式查詢與分析數據,或用自然語言查詢會員名單(NL→SQL)。本期回覆為示範,Claude API 於後續接通。"
      />

      <Segmented<Mode>
        style={{ marginBottom: 16 }}
        value={mode}
        onChange={setMode}
        options={[
          { label: "對話", value: "chat" },
          { label: "會員查詢", value: "member" },
        ]}
      />

      {mode === "member" && (
        <div>
          <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
            <Input.TextArea
              value={memberText}
              onChange={(e) => setMemberText(e.target.value)}
              placeholder="用中文描述會員條件,例如:過去 90 天買過保健品但近 5 封 EDM 未開啟的會員"
              autoSize={{ minRows: 1, maxRows: 4 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  runMemberQuery();
                }
              }}
            />
            <Button type="primary" onClick={runMemberQuery}>
              查詢
            </Button>
          </Space.Compact>

          {sql && (
            <>
              <Card title="生成的 SQL（示範）" size="small" style={{ marginBottom: 16 }}>
                <Paragraph style={{ marginBottom: 0 }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{sql}</pre>
                </Paragraph>
              </Card>
              <Card
                title="符合的會員名單（示範）"
                size="small"
                extra={<Statistic value={memberRows.length} suffix="筆" valueStyle={{ fontSize: 16 }} />}
              >
                <Table<MemberRow>
                  rowKey="member_id"
                  size="small"
                  pagination={false}
                  dataSource={memberRows}
                  columns={[
                    { title: "會員 ID", dataIndex: "member_id" },
                    { title: "姓名", dataIndex: "name" },
                    { title: "最後購買", dataIndex: "last_order_at" },
                    { title: "CLV", dataIndex: "ltv", render: (v: number) => `NT$ ${v.toLocaleString()}` },
                  ]}
                />
                <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                  Phase 2 由 LLM 生成受控 SQL,經 BigQuery 執行後回傳真實名單。
                </Text>
              </Card>
            </>
          )}
        </div>
      )}

      {mode === "chat" && (
      <>
      <Card
        style={{ marginBottom: 16 }}
        styles={{ body: { minHeight: 360, maxHeight: 480, overflowY: "auto" } }}
      >
        <List
          dataSource={messages}
          locale={{ emptyText: "輸入訊息開始對話" }}
          renderItem={(m) => (
            <List.Item style={{ border: "none" }}>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={m.role === "user" ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: m.role === "user" ? "#1677ff" : "#52c41a",
                    }}
                  />
                }
                title={m.role === "user" ? "你" : "助理"}
                description={
                  <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Space.Compact style={{ width: "100%" }}>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入你的問題,例如:這週 ROAS 表現如何?"
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button type="primary" loading={sending} onClick={send}>
          送出
        </Button>
      </Space.Compact>
      </>
      )}
    </div>
  );
}
