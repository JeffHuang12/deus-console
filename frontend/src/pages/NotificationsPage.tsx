import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Segmented,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  BellOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type {
  Notification,
  NotificationFeedback,
  NotificationSeverity,
} from "../api/types";

const { Text, Paragraph } = Typography;

const CATEGORY_COLOR: Record<string, string> = {
  庫存預警: "red",
  素材疲勞: "volcano",
  受眾建議: "geekblue",
  廣告成效: "magenta",
  趨勢洞察: "blue",
  客服洞察: "purple",
};

const SEVERITY: Record<NotificationSeverity, { label: string; color: string; rank: number }> = {
  high: { label: "急迫", color: "red", rank: 0 },
  mid: { label: "中", color: "orange", rank: 1 },
  low: { label: "低", color: "default", rank: 2 },
};

// 相對日期標示（今天／昨天／原日期）
function relativeDate(date: string): string {
  if (date === "2026-06-23") return "今天";
  if (date === "2026-06-22") return "昨天";
  return date;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>();
  const [unreadOnly, setUnreadOnly] = useState<"all" | "unread">("all");

  useEffect(() => {
    api
      .getNotifications()
      .then(setItems)
      .catch(() => message.error("讀取通知失敗，請稍後再試"))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((n) => n.category))),
    [items]
  );
  const unreadCount = items.filter((n) => !n.read).length;

  const filtered = useMemo(
    () =>
      items.filter(
        (n) =>
          (!category || n.category === category) &&
          (unreadOnly === "all" || !n.read)
      ),
    [items, category, unreadOnly]
  );

  // 依日期分組（新到舊）；同組內依急迫度、再依時間新到舊
  const groups = useMemo(() => {
    const map = new Map<string, Notification[]>();
    filtered.forEach((n) => {
      if (!map.has(n.date)) map.set(n.date, []);
      map.get(n.date)!.push(n);
    });
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          SEVERITY[a.severity].rank - SEVERITY[b.severity].rank ||
          b.time.localeCompare(a.time)
      );
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const markRead = (ids: string[]) => {
    if (ids.length === 0) return;
    setItems((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
    );
    api.markNotificationsRead(ids).catch(() => {
      // 失敗則回滾
      setItems((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read: false } : n))
      );
      message.error("標記已讀失敗");
    });
  };

  const goAction = (n: Notification) => {
    markRead([n.id]);
    navigate(n.action_route);
  };

  // 點同一個按鈕再點一次＝取消（toggle）；失敗回滾
  const react = async (n: Notification, fb: NotificationFeedback) => {
    const prev = n.feedback;
    const next = prev === fb ? null : fb;
    setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, feedback: next } : x)));
    try {
      await api.reactNotification(n.id, next);
      if (next === "like") message.success("已標記喜歡，AI 會多推類似內容");
      else if (next === "dislike") message.info("已標記不喜歡，AI 會減少類似內容");
      else message.info("已取消標記");
    } catch {
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, feedback: prev } : x)));
      message.error("操作失敗，請再試一次");
    }
  };

  return (
    <div>
      <PageHeader
        title="通知中心"
        description="AI 每天自動執行查詢，主動把值得關注的洞察推送到這裡。點「前往」可直接到對應頁面處理；對每則點喜歡／不喜歡可調整之後推送。本期為示範資料。"
      />

      <Alert
        type="info"
        showIcon
        icon={<BellOutlined />}
        style={{ marginBottom: 16 }}
        message="AI 每日 09:00 自動執行，跨庫存、廣告、受眾、客服等面向產出洞察。"
      />

      <Space wrap style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Space wrap>
          <Segmented
            value={unreadOnly}
            onChange={(v) => setUnreadOnly(v as "all" | "unread")}
            options={[
              { label: "全部", value: "all" },
              { label: `未讀（${unreadCount}）`, value: "unread" },
            ]}
          />
          <Select
            allowClear
            placeholder="全部類別"
            style={{ width: 160 }}
            value={category}
            onChange={setCategory}
            options={categories.map((c) => ({ label: c, value: c }))}
          />
        </Space>
        <Button
          disabled={unreadCount === 0}
          onClick={() => markRead(items.filter((n) => !n.read).map((n) => n.id))}
        >
          全部標為已讀
        </Button>
      </Space>

      {loading && <Skeleton active paragraph={{ rows: 6 }} />}

      {!loading && filtered.length === 0 && (
        <Empty description="目前沒有符合條件的通知。AI 將於每日 09:00 產出新洞察。" />
      )}

      {!loading &&
        groups.map(([date, list]) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
              {relativeDate(date)}（{date}）
            </Text>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {list.map((n) => (
                <Card
                  key={n.id}
                  size="small"
                  style={{
                    borderLeft: n.read ? undefined : "3px solid #1677ff",
                    background: n.read ? undefined : "#f6fbff",
                  }}
                >
                  <Space direction="vertical" size={6} style={{ width: "100%" }}>
                    <Space wrap>
                      {!n.read && <Tag color="blue">未讀</Tag>}
                      <Tag color={SEVERITY[n.severity].color}>{SEVERITY[n.severity].label}</Tag>
                      <Tag color={CATEGORY_COLOR[n.category] ?? "default"}>{n.category}</Tag>
                      <Text strong>{n.title}</Text>
                    </Space>
                    <Paragraph style={{ marginBottom: 0 }}>{n.content}</Paragraph>
                    <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        來源：{n.source}・{n.time}
                      </Text>
                      <Space wrap>
                        <Button
                          size="small"
                          type="primary"
                          icon={<ArrowRightOutlined />}
                          onClick={() => goAction(n)}
                        >
                          {n.action_label}
                        </Button>
                        {!n.read && (
                          <Button size="small" type="text" onClick={() => markRead([n.id])}>
                            標為已讀
                          </Button>
                        )}
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
                          icon={n.feedback === "dislike" ? <DislikeFilled /> : <DislikeOutlined />}
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
