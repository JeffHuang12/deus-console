import { useEffect, useState } from "react";
import { Alert, Table, Tag } from "antd";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { api } from "../api/client";
import type { AttributionData } from "../api/types";

export default function AttributionPage() {
  const [data, setData] = useState<AttributionData | null>(null);

  useEffect(() => {
    api.getAttribution().then(setData);
  }, []);

  if (!data) return null;

  return (
    <div>
      <PageHeader
        title="歸因分析"
        description="合併廣告、EDM、LINE 與成交事件，計算多通路真實貢獻並分析路徑成敗。素材疲勞偵測請見「素材疲勞偵測」頁。本期為示範資料。"
      />

      <SectionCard index={1} title="多通路歸因合併">
        <Table
          rowKey={(r) => r.path}
          dataSource={data.paths}
          pagination={false}
          size="middle"
          columns={[
            { title: "轉換路徑", dataIndex: "path" },
            { title: "轉換數", dataIndex: "conversions" },
            {
              title: "貢獻佔比",
              dataIndex: "contribution_pct",
              render: (v: number) => <Tag color="blue">{v}%</Tag>,
            },
          ]}
        />
      </SectionCard>

      <SectionCard index={2} title="路徑語意分析（LLM）">
        <Alert type="info" showIcon message="優化建議" description={data.path_narrative} />
      </SectionCard>
    </div>
  );
}
