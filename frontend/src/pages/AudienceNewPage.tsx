import { useState } from "react";
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Collapse,
  Input,
  List,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StructuredConditionBuilder, {
  emptyRow,
  type ConditionState,
} from "../components/StructuredConditionBuilder";
import { api } from "../api/client";
import type { AudienceMethod, AudiencePreview, ParsedCondition } from "../api/types";
import {
  NL_EXAMPLES,
  RFM_PLATFORMS,
  RFM_SEGMENTS,
  RFM_SEND_RULES,
  RFM_TIERS,
  SMART_SEGMENTS,
} from "../api/audienceMeta";

const { Text, Paragraph } = Typography;

export default function AudienceNewPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<AudienceMethod>("natural_language");

  // 自然語言
  const [nlText, setNlText] = useState("");
  const [parsed, setParsed] = useState<ParsedCondition[] | null>(null);

  // 結構化條件
  const [conditions, setConditions] = useState<ConditionState>({
    join: "and",
    rows: [emptyRow()],
  });

  // 分群選擇(智慧分群 / RFM 共用 selectedSegment)
  const [segment, setSegment] = useState<string | null>(null);

  // 共用預覽 / 命名
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const resetPreview = () => {
    setPreview(null);
  };

  const switchTab = (k: string) => {
    setMethod(k as AudienceMethod);
    resetPreview();
    setSegment(null);
  };

  // --- 自然語言 ---
  const parseNl = async () => {
    if (!nlText.trim()) {
      message.warning("請輸入受眾描述");
      return;
    }
    setLoading(true);
    try {
      const res = await api.parseAudienceText(nlText.trim());
      setParsed(res.conditions);
      setPreview({
        estimated_count: res.estimated_count,
        condition_summary: res.condition_summary,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyParsedToStructured = () => {
    if (!parsed) return;
    setConditions({
      join: "and",
      rows: parsed.map((c) => ({
        include: c.include,
        field: "purchased_product",
        operator: "purchased_in",
        value: { label: c.value },
      })),
    });
    setMethod("structured");
    resetPreview();
    message.success("已套用到結構化條件");
  };

  // --- 共用:產生預覽 ---
  const generate = async (seg?: string) => {
    setLoading(true);
    try {
      const res = await api.previewAudience({
        method,
        text: nlText.trim() || undefined,
        conditions: { ...conditions },
        segment: seg ?? segment ?? undefined,
      });
      setPreview(res);
    } finally {
      setLoading(false);
    }
  };

  const pickSegment = (key: string, defaultName: string) => {
    setSegment(key);
    setName(defaultName);
    generate(key);
  };

  const save = async () => {
    if (!name.trim()) {
      message.warning("請為此受眾命名");
      return;
    }
    await api.createAudience({
      name: name.trim(),
      method,
      text: nlText.trim() || undefined,
      conditions: { ...conditions },
      segment: segment ?? undefined,
    });
    message.success("已儲存受眾");
    navigate("/audience");
  };

  // --- 各分頁內容 ---
  const nlTab = (
    <Space direction="vertical" style={{ width: "100%" }}>
      <div>
        <Text type="secondary">範例(點擊帶入):</Text>
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            {NL_EXAMPLES.map((ex) => (
              <Tag
                key={ex}
                color="blue"
                style={{ cursor: "pointer" }}
                onClick={() => setNlText(ex)}
              >
                {ex}
              </Tag>
            ))}
          </Space>
        </div>
      </div>
      <Input.TextArea
        rows={5}
        value={nlText}
        onChange={(e) => setNlText(e.target.value)}
        placeholder="例如:過去 1 個月有購買葉黃素的使用者"
      />
      <Space>
        <Button type="primary" loading={loading} onClick={parseNl}>
          解析為條件
        </Button>
      </Space>
      {parsed && (
        <Card size="small" title="解析出的結構化條件" style={{ marginTop: 8 }}>
          <List
            size="small"
            dataSource={parsed}
            renderItem={(c) => (
              <List.Item>
                <Tag color={c.include ? "green" : "red"}>{c.include ? "包含" : "排除"}</Tag>
                {c.field}・{c.operator}・{c.value}
              </List.Item>
            )}
          />
          <Button style={{ marginTop: 8 }} onClick={applyParsedToStructured}>
            套用到結構化條件
          </Button>
        </Card>
      )}
    </Space>
  );

  const structuredTab = (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StructuredConditionBuilder value={conditions} onChange={setConditions} />
      <Button type="primary" loading={loading} onClick={() => generate()}>
        產生受眾
      </Button>
    </Space>
  );

  const money = (n: number) => `NT$ ${n.toLocaleString("en-US")}`;
  const num = (n: number) => n.toLocaleString("en-US");

  const smartTab = (
    <Table
      rowKey="key"
      size="small"
      pagination={false}
      scroll={{ x: "max-content" }}
      dataSource={SMART_SEGMENTS}
      rowSelection={{
        type: "radio",
        selectedRowKeys: segment ? [segment] : [],
        onChange: (keys) => {
          const k = keys[0] as string;
          const seg = SMART_SEGMENTS.find((s) => s.key === k);
          if (seg) pickSegment(seg.key, seg.name);
        },
      }}
      expandable={{
        expandedRowRender: (s) => (
          <Space direction="vertical" size={2}>
            <Text type="secondary">回購週期:{s.repurchase}</Text>
            <Text type="secondary">消費次數:{s.frequency}</Text>
            <Text type="secondary">累積金額:{s.monetary}</Text>
          </Space>
        ),
      }}
      columns={[
        { title: "分眾名稱", dataIndex: "name" },
        { title: "人數", dataIndex: "count", render: num },
        { title: "總消費次數", dataIndex: "totalOrders", render: num },
        { title: "平均消費次數", dataIndex: "avgOrders" },
        { title: "總消費金額", dataIndex: "totalSpend", render: money },
        { title: "平均消費金額", dataIndex: "avgSpend", render: money },
        { title: "平均顧客終身價值", dataIndex: "clv", render: money },
        { title: "購買週期", dataIndex: "cycle" },
      ]}
    />
  );

  const rfmTab = (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        {RFM_SEGMENTS.map((s) => (
          <Col xs={24} sm={12} lg={8} key={s.key}>
            <Card
              size="small"
              title={`${s.rank}. ${s.name}`}
              extra={<Tag color="geekblue">{s.rfm}</Tag>}
              hoverable
              onClick={() => pickSegment(s.key, s.name)}
              style={{
                borderColor: segment === s.key ? "#1677ff" : undefined,
                borderWidth: segment === s.key ? 2 : 1,
              }}
            >
              <Paragraph style={{ marginBottom: 6 }}>{s.definition}</Paragraph>
              <Text type="secondary">Action:{s.action}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Collapse
        items={[
          {
            key: "tiers",
            label: "參考資料:RFM 級距與發送規則",
            children: (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Text strong>計算基準(R/F/M 級距)</Text>
                  <Table
                    style={{ marginTop: 8 }}
                    size="small"
                    pagination={false}
                    rowKey="metric"
                    dataSource={RFM_TIERS}
                    columns={[
                      { title: "指標", dataIndex: "metric" },
                      { title: "總平均", dataIndex: "avg" },
                      { title: "級距 1", dataIndex: "t1" },
                      { title: "級距 2", dataIndex: "t2" },
                      { title: "級距 3", dataIndex: "t3" },
                    ]}
                  />
                </div>
                <div>
                  <Text strong>常態發送規則</Text>
                  <Table
                    style={{ marginTop: 8 }}
                    size="small"
                    pagination={false}
                    rowKey="rank"
                    dataSource={RFM_SEND_RULES}
                    columns={[
                      { title: "RANK", dataIndex: "rank", width: 70 },
                      { title: "分群", dataIndex: "group" },
                      { title: "發送規則", dataIndex: "rule" },
                      { title: "目標", dataIndex: "target" },
                    ]}
                  />
                </div>
                <div>
                  <Text strong>發送平台對應</Text>
                  <Table
                    style={{ marginTop: 8 }}
                    size="small"
                    pagination={false}
                    rowKey="rank"
                    dataSource={RFM_PLATFORMS}
                    columns={[
                      { title: "對象", dataIndex: "rank" },
                      { title: "平台", dataIndex: "platform" },
                    ]}
                  />
                </div>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[{ title: <Link to="/audience">受眾管理</Link> }, { title: "新建受眾" }]}
      />
      <PageHeader title="新建受眾" description="以四種方式之一描述受眾,產生後命名並儲存。本期人數為示範值。" />

      <Card style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={method}
          onChange={switchTab}
          items={[
            { key: "natural_language", label: "自然語言", children: nlTab },
            { key: "structured", label: "結構化條件", children: structuredTab },
            { key: "smart_segment", label: "智慧分群", children: smartTab },
            { key: "rfm", label: "RFM 智慧分群", children: rfmTab },
          ]}
        />
      </Card>

      {preview && (
        <Card title="受眾預覽" style={{ marginBottom: 16 }}>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Statistic title="預估人數" value={preview.estimated_count} suffix="人" />
            </Col>
            <Col xs={24} md={16}>
              <Text type="secondary">條件摘要</Text>
              <List
                size="small"
                dataSource={preview.condition_summary}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Col>
          </Row>

          <Space.Compact style={{ width: "100%", maxWidth: 480, marginTop: 16 }}>
            <Input
              placeholder="請為此受眾命名"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="primary" onClick={save}>
              儲存受眾
            </Button>
          </Space.Compact>
        </Card>
      )}
    </div>
  );
}
