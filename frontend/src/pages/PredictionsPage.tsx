import { useEffect, useState } from "react";
import { Alert, Table, Tag, Typography } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { api } from "../api/client";
import type { PredictionModel, PredictionResult } from "../api/types";

const { Text } = Typography;

const MODEL_STATUS_LABEL: Record<string, string> = {
  planning: "規劃中",
  training: "訓練中",
  ready: "可用",
};

export default function PredictionsPage() {
  const [models, setModels] = useState<PredictionModel[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  useEffect(() => {
    api.getPredictionModels().then((ms) => {
      setModels(ms);
      if (ms.length) setSelected(ms[0].id);
    });
  }, []);

  useEffect(() => {
    if (selected) api.getPredictionResult(selected).then(setResult);
  }, [selected]);

  const selectedModel = models.find((m) => m.id === selected);

  return (
    <div>
      <PageHeader
        title="預測模型中心"
        description="集中管理 CLV、流失、回購、退貨預警等預測模型，檢視預測結果與分佈，並設定觸發動作。本期為示範資料，Phase 2 由 BigQuery 取數＋離線模型推論。"
      />

      <SectionCard index={1} title="模型清單">
        <Table<PredictionModel>
          rowKey="id"
          dataSource={models}
          pagination={false}
          size="middle"
          rowClassName={(r) => (r.id === selected ? "ant-table-row-selected" : "")}
          onRow={(r) => ({ onClick: () => setSelected(r.id), style: { cursor: "pointer" } })}
          columns={[
            { title: "模型", dataIndex: "name" },
            { title: "預測目標", dataIndex: "target" },
            {
              title: "狀態",
              dataIndex: "status",
              render: (s: string) => <Tag>{MODEL_STATUS_LABEL[s] ?? s}</Tag>,
            },
            {
              title: "最後訓練",
              dataIndex: "last_trained",
              render: (v: string | null) => v ?? "尚未訓練",
            },
            { title: "樣本數", dataIndex: "samples" },
          ]}
        />
        <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
          點選任一模型查看預測結果。
        </Text>
      </SectionCard>

      {selectedModel && result && (
        <SectionCard index={2} title={`預測結果與觸發：${selectedModel.name}`}>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="觸發設定"
            description={result.trigger_hint}
          />

          <Typography.Title level={5}>預測值分佈</Typography.Title>
          <div style={{ height: 280, marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1677ff" name="人數" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <Typography.Title level={5}>樣本名單（示範）</Typography.Title>
          <Table
            rowKey={(r) => String(r[result.columns[0]])}
            dataSource={result.rows}
            pagination={false}
            size="small"
            columns={result.columns.map((c) => ({ title: c, dataIndex: c }))}
          />
        </SectionCard>
      )}
    </div>
  );
}
