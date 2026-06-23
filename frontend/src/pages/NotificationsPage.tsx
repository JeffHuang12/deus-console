import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Space, Tag, Typography, message } from "antd";
import {
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  BellOutlined,
} from "@ant-design/icons";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type { Notification, NotificationFeedback } from "../api/types";

const { Text, Paragraph } = Typography;

const CATEGORY_COLOR: Record<string, string> = {
  庫存預警: "red",
  素材疲勞: "volcano",
  受眾建議: "geekblue",
  廣告成效: "magenta",
  趨勢洞察: "blue",
  客服洞察: "purple",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    api.getNotifications().then(setItems);
  }, []);

  // 點同一個按鈕再點一次＝取消（toggle）
  const react = async (n: Notification, fb: NotificationFeedback) => {
    const next = n.feedback === fb ? null : fb;
    // 樂觀更新
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, feedback: next } : x)));
    await api.reactNotification(n.id, next);
    if (next === "like") message.success("已標記喜歡，AI 會多推類似內容");
    else if (next === "dislike") message.info("已標記不喜歡，AI 會減少類似內容");
  };

  // 依日期分組（新到舊）
  const groups = useMemo(() => {
    const map = new Map<string, Notification[]>();
    items.forEach((n) => {
      if (!map.has(n.date)) map.set(n.date, []);
      map.get(n.date)!.push(n);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  return (
    <div>
      <PageHeader
        title="通知中心"
        description="AI 每天自動執行查詢，主動把值得關注的洞察推送到這裡。對每則點喜歡／不喜歡，可幫助 AI 調整之後推送的內容。本期為示範資料。"
      />

      <Alert
        type="info"
        showIcon
        icon={<BellOutlined />}
        style={{ marginBottom: 16 }}
        message="AI 每日 09:00 自動執行，跨庫存、廣告、受眾、客服等面向產出洞察。"
      />

      {groups.map(([date, list]) => (
        <div key={date} style={{ marginBottom: 24 }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            {date}
          </Text>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {list.map((n) => (
              <Card key={n.id} size="small">
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <Space wrap>
                    <Tag color={CATEGORY_COLOR[n.category] ?? "default"}>{n.category}</Tag>
                    <Text strong>{n.title}</Text>
                  </Space>
                  <Paragraph style={{ marginBottom: 0 }}>{n.content}</Paragraph>
                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                    wrap
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      來源：{n.source}・{n.time}
                    </Text>
                    <Space>
                      <Button
                        size="small"
                        type={n.feedback === "like" ? "primary" : "default"}
                        icon={n.feedback === "like" ? <LikeFilled /> : <LikeOutlined />}
                        onClick={() => react(n, "like")}
                      >
                        喜歡
                      </Button>
                      <Button
                        size="small"
                        danger={n.feedback === "dislike"}
                        icon={
                          n.feedback === "dislike" ? <DislikeFilled /> : <DislikeOutlined />
                        }
                        onClick={() => react(n, "dislike")}
                      >
                        不喜歡
                      </Button>
                    </Space>
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        </div>
      ))}
    </div>
  );
}
