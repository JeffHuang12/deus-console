import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { EditOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type { InventoryProduct, MerchantFeed } from "../api/types";

const { Text } = Typography;

// Data Feed 各欄位的規格摘要（Google/Meta 共用要點）
const FEED_SPEC: Record<keyof Omit<MerchantFeed, "sku">, string> = {
  id: "專屬且不變,最多 50 字元,盡量用 SKU,各國同產品同 ID",
  title: "如實描述、與到達網頁相符,最多 150 字元,勿用促銷字/全大寫",
  description: "純文字最多 5000 字,僅含產品資訊,勿放連結/促銷/競品",
  link: "有效到達網頁網址,http/https 開頭,符合 RFC 2396/1738",
  image_link: "主要產品圖,≥ 500x500,勿加浮水印/框線,AI 圖須保留來源中繼資料",
  availability: "有現貨/缺貨中/預購/缺貨待補,須與結帳頁一致",
  brand: "品牌名稱,最多 70 半形字元",
  price: "結帳應付總額,ISO 4217（如 TWD）,小數點為半形句點",
};

const FEED_LABEL: Record<keyof Omit<MerchantFeed, "sku">, string> = {
  id: "ID [id]",
  title: "名稱 [title]",
  description: "說明 [description]",
  link: "連結 [link]",
  image_link: "圖片連結 [image_link]",
  availability: "供應情形 [availability]",
  brand: "品牌 [brand]",
  price: "價格 [price]",
};

// YoY 百分比：成長綠、衰退紅
function Yoy({ v }: { v: number }) {
  const color = v > 0 ? "#52c41a" : v < 0 ? "#cf1322" : "#999";
  const sign = v > 0 ? "+" : "";
  return (
    <Text style={{ color, fontSize: 12, marginLeft: 6 }}>
      {sign}
      {v}%
    </Text>
  );
}

export default function MerchandisingPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [safety, setSafety] = useState<Record<string, number>>({});
  const [feedSku, setFeedSku] = useState<string | null>(null);
  const [feed, setFeed] = useState<MerchantFeed | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MerchantFeed | null>(null);

  useEffect(() => {
    api.getInventory().then((ps) => {
      setProducts(ps);
      setSafety(Object.fromEntries(ps.map((p) => [p.sku, p.safety_stock])));
    });
  }, []);

  // 開啟「編輯商品資料」抽屜：先載入現有 feed（檢視模式）
  const openFeed = async (sku: string) => {
    setFeedSku(sku);
    setFeed(null);
    setEditing(false);
    setFeedLoading(true);
    try {
      setFeed(await api.getMerchantFeed(sku));
    } finally {
      setFeedLoading(false);
    }
  };

  // 重新整理：重新取得產品資料並由 AI 重新產出文案
  const regenerate = async () => {
    if (!feedSku) return;
    setEditing(false);
    setFeedLoading(true);
    try {
      setFeed(await api.getMerchantFeed(feedSku));
      message.success("已重新取得產品資料並由 AI 產出文案");
    } finally {
      setFeedLoading(false);
    }
  };

  // 編輯：把目前內容複製成草稿,切到可編輯
  const startEdit = () => {
    if (feed) setDraft({ ...feed });
    setEditing(true);
  };

  // 儲存：把草稿寫回(更新商品資料)
  const saveEdit = () => {
    if (draft) setFeed(draft);
    setEditing(false);
    message.success("已儲存商品資料");
  };

  const advise = (p: InventoryProduct): { label: string; color: string } => {
    const safe = safety[p.sku] ?? p.safety_stock;
    const days = p.daily_avg > 0 ? p.stock / p.daily_avg : 999;
    if (p.stock < safe || days < 7) return { label: "補貨／暫停廣告", color: "red" };
    if (p.last_month_yoy >= 15) return { label: "加碼投放", color: "green" };
    if (p.last_month_yoy <= -15) return { label: "促銷出清", color: "orange" };
    return { label: "維持", color: "default" };
  };

  const columns = useMemo(
    () => [
      { title: "SKU", dataIndex: "sku", width: 96 },
      { title: "商品名稱", dataIndex: "name" },
      { title: "目前庫存", dataIndex: "stock", sorter: (a: InventoryProduct, b: InventoryProduct) => a.stock - b.stock },
      {
        title: "安全庫存",
        key: "safety",
        render: (_: unknown, p: InventoryProduct) => (
          <InputNumber
            size="small"
            min={0}
            value={safety[p.sku] ?? p.safety_stock}
            onChange={(v) => setSafety((s) => ({ ...s, [p.sku]: Number(v) || 0 }))}
            style={{ width: 80 }}
          />
        ),
      },
      {
        title: (
          <Tooltip title="目前庫存 ÷ 近 7 天日均銷量。決定是否暫停廣告的關鍵指標。">
            預估可售天數
          </Tooltip>
        ),
        key: "days",
        render: (_: unknown, p: InventoryProduct) => {
          const days = p.daily_avg > 0 ? Math.round(p.stock / p.daily_avg) : 999;
          return <Text type={days < 7 ? "danger" : undefined}>{days} 天</Text>;
        },
        sorter: (a: InventoryProduct, b: InventoryProduct) =>
          a.stock / (a.daily_avg || 1) - b.stock / (b.daily_avg || 1),
      },
      {
        title: "上月銷售（YoY）",
        key: "lm",
        render: (_: unknown, p: InventoryProduct) => (
          <span>
            {p.last_month_sales}
            <Yoy v={p.last_month_yoy} />
          </span>
        ),
      },
      {
        title: "上上月銷售（YoY）",
        key: "pm",
        render: (_: unknown, p: InventoryProduct) => (
          <span>
            {p.prev_month_sales}
            <Yoy v={p.prev_month_yoy} />
          </span>
        ),
      },
      {
        title: (
          <Tooltip title="過去 7 天 YoY 易受去年同期檔期干擾,僅供參考。">
            過去 7 天（YoY）
          </Tooltip>
        ),
        key: "l7",
        render: (_: unknown, p: InventoryProduct) => (
          <span>
            {p.last7_sales}
            <Yoy v={p.last7_yoy} />
          </span>
        ),
      },
      {
        title: "建議行動",
        key: "advise",
        render: (_: unknown, p: InventoryProduct) => {
          const a = advise(p);
          return <Tag color={a.color}>{a.label}</Tag>;
        },
      },
      {
        title: "商品內容",
        key: "feed",
        render: (_: unknown, p: InventoryProduct) => (
          <Tooltip title="檢視/編輯 Google/Meta Data Feed 欄位">
            <Button size="small" icon={<EditOutlined />} onClick={() => openFeed(p.sku)}>
              編輯商品資料
            </Button>
          </Tooltip>
        ),
      },
    ],
    [safety]
  );

  return (
    <div>
      <PageHeader
        title="商品與庫存中心"
        description="全產品庫存與廣告連動：依預估可售天數與 YoY 給建議行動；可設定安全庫存。並用 AI 生成 Google／Meta Data Feed 欄位。本期為示範資料。"
      />

      <Table<InventoryProduct>
        rowKey="sku"
        size="middle"
        pagination={false}
        dataSource={products}
        columns={columns}
        scroll={{ x: "max-content" }}
      />

      <Drawer
        title={`編輯商品資料 — ${feedSku ?? ""}`}
        width={600}
        open={!!feedSku}
        onClose={() => setFeedSku(null)}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} disabled={feedLoading} onClick={regenerate}>
              重新整理
            </Button>
            {editing ? (
              <Button type="primary" icon={<SaveOutlined />} onClick={saveEdit}>
                儲存
              </Button>
            ) : (
              <Button icon={<EditOutlined />} disabled={!feed} onClick={startEdit}>
                編輯
              </Button>
            )}
            <Button
              type="primary"
              disabled={!feed || editing}
              onClick={() => message.success("已送出同步至 Google／Meta Data Feed（示範）")}
            >
              同步到 Data Feed
            </Button>
          </Space>
        }
      >
        {feedLoading && (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
            <Text type="secondary" style={{ marginLeft: 12 }}>
              AI 取得產品資料中…
            </Text>
          </div>
        )}

        {feed && !editing && (
          <Descriptions column={1} bordered size="small">
            {(Object.keys(FEED_LABEL) as (keyof typeof FEED_LABEL)[]).map((k) => (
              <Descriptions.Item key={k} label={FEED_LABEL[k]}>
                <Space direction="vertical" size={2}>
                  <Text>{feed[k]}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {FEED_SPEC[k]}
                  </Text>
                </Space>
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}

        {editing && draft && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {(Object.keys(FEED_LABEL) as (keyof typeof FEED_LABEL)[]).map((k) => (
              <div key={k}>
                <Text strong>{FEED_LABEL[k]}</Text>
                {k === "description" ? (
                  <Input.TextArea
                    style={{ marginTop: 4 }}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    value={draft[k]}
                    onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                  />
                ) : k === "availability" ? (
                  <Select
                    style={{ marginTop: 4, width: 200, display: "block" }}
                    value={draft[k]}
                    onChange={(v) => setDraft({ ...draft, [k]: v })}
                    options={["有現貨", "缺貨中", "預購", "缺貨待補"].map((o) => ({ label: o, value: o }))}
                  />
                ) : (
                  <Input
                    style={{ marginTop: 4 }}
                    value={draft[k]}
                    onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                  />
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {FEED_SPEC[k]}
                </Text>
              </div>
            ))}
          </Space>
        )}
      </Drawer>
    </div>
  );
}
