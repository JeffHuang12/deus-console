import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import PageHeader from "../components/PageHeader";
import StatusTag from "../components/StatusTag";
import { api } from "../api/client";
import type { BindingActionResult, DataSource } from "../api/types";

const { Text } = Typography;

export default function BindingPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [shopline, setShopline] = useState<BindingActionResult | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  // api_key 類型資料源(如 Boxful)綁定時的 token 輸入 modal
  const [keyModal, setKeyModal] = useState<DataSource | null>(null);
  const [keyValue, setKeyValue] = useState("");

  const reload = async () => {
    const [s, sl] = await Promise.all([
      api.listSources(),
      api.getShoplineStatus(),
    ]);
    setSources(s);
    setShopline(sl);
  };

  useEffect(() => {
    reload();
  }, []);

  const saveShopline = async () => {
    if (!token.trim()) {
      message.warning("請先輸入 Shopline API Key");
      return;
    }
    setLoading(true);
    try {
      const res = await api.bindShopline(token.trim());
      setShopline(res);
      message.success(res.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = async (s: DataSource) => {
    // 已連線 → 解除;未連線且需 API Key → 開 modal;未連線 oauth → 直接 stub 連線
    if (s.status === "connected") {
      const res = await api.disconnectSource(s.id);
      message.info(res.message);
      reload();
      return;
    }
    if (s.auth_kind === "api_key") {
      setKeyValue("");
      setKeyModal(s);
      return;
    }
    const res = await api.connectSource(s.id);
    message.info(res.message);
    reload();
  };

  const submitKey = async () => {
    if (!keyModal) return;
    if (!keyValue.trim()) {
      message.warning("請輸入 API Key");
      return;
    }
    const res = await api.connectSource(keyModal.id, keyValue.trim());
    message.info(res.message);
    setKeyModal(null);
    reload();
  };

  return (
    <div>
      <PageHeader
        title="數據綁定"
        description="輸入 Shopline API Key,並綁定各廣告與社群資料源。本期為示範骨架,實際授權流程於後續接通。"
      />

      <Card title="Shopline API Key" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text type="secondary">
            貼上 Shopline access token,程式讀取後即可執行資料更新。
            {shopline && (
              <span style={{ marginLeft: 8 }}>
                目前狀態:<StatusTag status={shopline.status} />
              </span>
            )}
          </Text>
          <Space.Compact style={{ width: "100%" }}>
            <Input.Password
              placeholder="請輸入 Shopline access token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button type="primary" loading={loading} onClick={saveShopline}>
              儲存並綁定
            </Button>
          </Space.Compact>
        </Space>
      </Card>

      <Typography.Title level={5}>資料源綁定</Typography.Title>
      <Row gutter={[16, 16]}>
        {sources.map((s) => (
          <Col xs={24} sm={12} md={8} key={s.id}>
            <Card
              size="small"
              title={s.name}
              extra={<StatusTag status={s.status} />}
            >
              <div style={{ minHeight: 32, marginBottom: 12 }}>
                <Tag color={s.auth_kind === "api_key" ? "gold" : "blue"}>
                  {s.auth_kind === "api_key" ? "API Key" : "OAuth"}
                </Tag>
                <Text type="secondary">
                  {s.status === "connected"
                    ? `帳號:${s.account ?? "-"}`
                    : "尚未綁定"}
                </Text>
              </div>
              <Button
                block
                type={s.status === "connected" ? "default" : "primary"}
                onClick={() => toggleSource(s)}
              >
                {s.status === "connected" ? "解除綁定" : "綁定"}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={`綁定 ${keyModal?.name ?? ""}`}
        open={keyModal !== null}
        onOk={submitKey}
        onCancel={() => setKeyModal(null)}
        okText="儲存並綁定"
        cancelText="取消"
      >
        <Text type="secondary">
          請輸入 {keyModal?.name} 的 API Key,程式讀取後即可執行資料更新。
        </Text>
        <Input.Password
          style={{ marginTop: 12 }}
          placeholder="請輸入 API Key"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          onPressEnter={submitKey}
        />
      </Modal>
    </div>
  );
}
