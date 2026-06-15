import { useEffect, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  Radio,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import { AD_CHANNEL_CONFIG, AD_FREQUENCIES, type AdChannelConfig } from "../api/audienceMeta";
import type { Audience } from "../api/types";

const { Text } = Typography;

type ChannelStatus =
  | { state: "idle" }
  | { state: "form"; frequency: string; fields: string[]; name: string }
  | { state: "building" }
  | { state: "done"; count: number }
  | { state: "failed" };

export default function AudienceAdBuildPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ChannelStatus>>({
    meta: { state: "idle" },
    google: { state: "idle" },
    line: { state: "idle" },
  });

  useEffect(() => {
    api.getAudience(id).then(setAudience);
  }, [id]);

  const setCh = (ch: string, s: ChannelStatus) =>
    setStatuses((prev) => ({ ...prev, [ch]: s }));

  const confirm = async (cfg: AdChannelConfig, frequency: string, fields: string[], name: string) => {
    if (cfg.requireName && !name.trim()) {
      message.warning("請輸入受眾名稱");
      return;
    }
    if (fields.length === 0) {
      message.warning("請至少選擇一個比對欄位");
      return;
    }
    setCh(cfg.key, { state: "building" });
    try {
      const res = await api.buildAdAudience(id, {
        channel: cfg.key,
        frequency,
        match_fields: fields,
        name: name.trim() || undefined,
      });
      if (res.status === "done") setCh(cfg.key, { state: "done", count: res.count ?? 0 });
      else setCh(cfg.key, { state: "failed" });
    } catch {
      setCh(cfg.key, { state: "failed" });
    }
  };

  const renderBody = (cfg: AdChannelConfig) => {
    const s = statuses[cfg.key];
    switch (s.state) {
      case "idle":
        return (
          <Button
            type="primary"
            onClick={() =>
              setCh(cfg.key, { state: "form", frequency: "手動", fields: cfg.defaults, name: "" })
            }
          >
            建立受眾
          </Button>
        );
      case "form":
        return (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {cfg.requireName && (
              <div>
                <Text>受眾名稱</Text>
                <Input
                  style={{ marginTop: 4 }}
                  placeholder="請輸入廣告受眾名稱"
                  value={s.name}
                  onChange={(e) => setCh(cfg.key, { ...s, name: e.target.value })}
                />
              </div>
            )}
            <div>
              <Text>更新頻率</Text>
              <Radio.Group
                style={{ display: "block", marginTop: 4 }}
                optionType="button"
                options={AD_FREQUENCIES}
                value={s.frequency}
                onChange={(e) => setCh(cfg.key, { ...s, frequency: e.target.value })}
              />
            </div>
            <div>
              <Text>比對欄位</Text>
              <Checkbox.Group
                style={{ display: "block", marginTop: 4 }}
                options={cfg.fields}
                value={s.fields}
                onChange={(v) => setCh(cfg.key, { ...s, fields: v as string[] })}
              />
            </div>
            {cfg.cleanRules.length > 0 && (
              <Alert
                type="info"
                showIcon
                message="清洗規則"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {cfg.cleanRules.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                }
              />
            )}
            <Space>
              <Button type="primary" onClick={() => confirm(cfg, s.frequency, s.fields, s.name)}>
                確認建立
              </Button>
              <Button onClick={() => setCh(cfg.key, { state: "idle" })}>取消</Button>
            </Space>
          </Space>
        );
      case "building":
        return <Tag icon={<LoadingOutlined />} color="processing">建立中</Tag>;
      case "done":
        return (
          <Space direction="vertical">
            <Tag color="success">已完成・{s.count.toLocaleString("en-US")} 人</Tag>
            <Button size="small" onClick={() => setCh(cfg.key, { state: "idle" })}>重新建立</Button>
          </Space>
        );
      case "failed":
        return (
          <Space direction="vertical">
            <Tag color="error">失敗</Tag>
            <Button size="small" onClick={() => setCh(cfg.key, { state: "idle" })}>重試</Button>
          </Space>
        );
    }
  };

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to="/audience">受眾管理</Link> },
          { title: audience?.name ?? "受眾" },
          { title: "廣告受眾建立" },
        ]}
      />
      <PageHeader
        title={audience ? `${audience.name} — 廣告受眾建立` : "廣告受眾建立"}
        description="把此受眾同步到廣告平台。選擇比對欄位與更新頻率後建立,清洗與實際串接於 Phase 2 執行。"
      />

      <Row gutter={[16, 16]} align="top">
        {AD_CHANNEL_CONFIG.map((cfg) => (
          <Col xs={24} md={8} key={cfg.key}>
            <Card title={cfg.name} style={{ minHeight: 240 }}>
              {renderBody(cfg)}
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 24 }}>
        <Button onClick={() => navigate("/audience")}>返回清單</Button>
      </div>
    </div>
  );
}
