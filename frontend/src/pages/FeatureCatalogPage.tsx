import { useMemo, useState } from "react";
import {
  Card,
  Col,
  Empty,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import {
  FEATURE_CATALOG,
  GROUP_LABELS,
  PLACEMENT_LABELS,
  PLACEMENT_ROUTE,
  STATUS_COLORS,
  STATUS_LABELS,
  THRESHOLD_LABELS,
  VALUE_TAG_COLORS,
  VALUE_TAG_LABELS,
  countByStatus,
  type FeatureGroup,
  type FeatureStatus,
} from "../api/featureCatalog";

const { Text, Paragraph } = Typography;

const GROUP_ORDER = Object.keys(GROUP_LABELS) as FeatureGroup[];

const THRESHOLD_COLOR: Record<string, string> = {
  low: "blue",
  mid: "orange",
  high: "red",
};

export default function FeatureCatalogPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<FeatureGroup[]>([]);
  const [status, setStatus] = useState<FeatureStatus | "all">("all");

  const counts = useMemo(() => countByStatus(), []);
  const total = FEATURE_CATALOG.length;

  const filtered = useMemo(
    () =>
      FEATURE_CATALOG.filter(
        (f) =>
          (groups.length === 0 || groups.includes(f.group)) &&
          (status === "all" || f.status === status)
      ),
    [groups, status]
  );

  // 依分組整理，維持固定組別順序。
  const grouped = useMemo(() => {
    return GROUP_ORDER.map((g) => ({
      group: g,
      items: filtered.filter((f) => f.group === g),
    })).filter((x) => x.items.length > 0);
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title="功能總覽"
        description="數據中台規劃的全部功能一覽。每項標示導入門檻與狀態（已上線／部分對應／規劃中），並可跳至對應頁面。資料來源為單一事實檔 featureCatalog.ts。"
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="功能總數" value={total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已上線"
              value={counts.live}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="部分對應"
              value={counts.partial}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="規劃中" value={counts.planned} />
          </Card>
        </Col>
      </Row>

      <Space wrap style={{ marginBottom: 16 }} size={12}>
        <Select
          mode="multiple"
          allowClear
          placeholder="篩選分組（不選＝全部）"
          style={{ minWidth: 280 }}
          value={groups}
          onChange={setGroups}
          options={GROUP_ORDER.map((g) => ({ label: GROUP_LABELS[g], value: g }))}
        />
        <Segmented
          value={status}
          onChange={(v) => setStatus(v as FeatureStatus | "all")}
          options={[
            { label: "全部狀態", value: "all" },
            { label: "已上線", value: "live" },
            { label: "部分對應", value: "partial" },
            { label: "規劃中", value: "planned" },
          ]}
        />
      </Space>

      {grouped.length === 0 && <Empty description="沒有符合條件的功能" />}

      {grouped.map(({ group, items }) => (
        <div key={group} style={{ marginBottom: 24 }}>
          <Typography.Title level={5} style={{ marginBottom: 12 }}>
            {GROUP_LABELS[group]}（{items.length}）
          </Typography.Title>
          <Row gutter={[16, 16]}>
            {items.map((f) => {
              const route = PLACEMENT_ROUTE[f.placement];
              return (
                <Col xs={24} sm={12} lg={8} key={f.id}>
                  <Card
                    size="small"
                    title={f.name}
                    extra={
                      <Tag color={STATUS_COLORS[f.status]}>
                        {STATUS_LABELS[f.status]}
                      </Tag>
                    }
                    style={{ height: "100%" }}
                  >
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Paragraph
                        type="secondary"
                        style={{ marginBottom: 0, fontSize: 13 }}
                        ellipsis={{ rows: 3, expandable: true, symbol: "展開" }}
                      >
                        {f.descEng}
                      </Paragraph>
                      <Text style={{ fontSize: 13 }}>
                        驗收：{f.acceptance}
                      </Text>
                      {f.effect && (
                        <Text style={{ fontSize: 13, color: "#c41d7f" }}>
                          預期效益：{f.effect}
                        </Text>
                      )}
                      <div>
                        {f.valueTag && (
                          <Tag color={VALUE_TAG_COLORS[f.valueTag]}>
                            {VALUE_TAG_LABELS[f.valueTag]}
                          </Tag>
                        )}
                        {f.threshold && (
                          <Tag color={THRESHOLD_COLOR[f.threshold]}>
                            {THRESHOLD_LABELS[f.threshold]}
                          </Tag>
                        )}
                        {route ? (
                          <Tag
                            color="processing"
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(route)}
                          >
                            {PLACEMENT_LABELS[f.placement]} →
                          </Tag>
                        ) : (
                          <Tag>{PLACEMENT_LABELS[f.placement]}</Tag>
                        )}
                      </div>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      ))}
    </div>
  );
}
