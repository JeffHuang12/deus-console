import { useState } from "react";
import { Avatar, Button, Card, Input, List, Space } from "antd";
import { RobotOutlined, UserOutlined } from "@ant-design/icons";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type { ChatMessage } from "../api/types";

export default function PromptPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

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
        description="以對話方式查詢與分析數據。本期回覆為示範,Claude API 於後續接通。"
      />

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
    </div>
  );
}
