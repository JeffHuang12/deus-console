import { useEffect, useMemo, useState } from "react";
import { Card, Segmented, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type { AssocWindow, ProductAssociation } from "../api/types";

const { Text } = Typography;

const WINDOW_OPTIONS = [
  { label: "同一筆訂單", value: "same_order" },
  { label: "30 天", value: "30d" },
  { label: "60 天", value: "60d" },
  { label: "90 天", value: "90d" },
];

export default function ProductAssociationsPage() {
  const [window, setWindow] = useState<AssocWindow>("60d");
  const [rows, setRows] = useState<ProductAssociation[]>([]);
  const [product, setProduct] = useState<string | undefined>();

  useEffect(() => {
    api.getProductAssociations(window).then(setRows);
  }, [window]);

  // 所有出現過的產品（供下拉篩選）
  const products = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      set.add(r.product_a);
      set.add(r.product_b);
    });
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(
    () =>
      product
        ? rows.filter((r) => r.product_a === product || r.product_b === product)
        : rows,
    [rows, product]
  );

  const adviseOf = (r: ProductAssociation) =>
    r.lift >= 2 && r.co_customers >= 100
      ? { label: "建議組合促銷", color: "green" }
      : { label: "觀察", color: "default" };

  return (
    <div>
      <PageHeader
        title="商品關聯分析"
        description="找出常被一起購買的商品對,作為組合促銷與交叉推薦的依據。提升度越高代表關聯越強。本期為示範資料。"
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="large">
          <Space>
            <Text>觀察窗：</Text>
            <Tooltip title="看顧客在多久內把兩樣都買齊。同一筆訂單＝同購籃;天數＝買 A 後 N 天內買 B。">
              <Segmented
                value={window}
                onChange={(v) => setWindow(v as AssocWindow)}
                options={WINDOW_OPTIONS}
              />
            </Tooltip>
          </Space>
          <Space>
            <Text>產品：</Text>
            <Select
              allowClear
              placeholder="全部產品"
              style={{ width: 200 }}
              value={product}
              onChange={setProduct}
              options={products.map((p) => ({ label: p, value: p }))}
            />
          </Space>
        </Space>
      </Card>

      <Table<ProductAssociation>
        rowKey={(r) => `${r.product_a}-${r.product_b}`}
        pagination={false}
        dataSource={filtered}
        columns={[
          { title: "商品 A", dataIndex: "product_a" },
          { title: "商品 B", dataIndex: "product_b" },
          {
            title: (
              <Tooltip title="lift 2 = 一起買的機率比隨機高 2 倍。> 1 才算正關聯。">
                提升度
              </Tooltip>
            ),
            dataIndex: "lift",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.lift - b.lift,
            render: (v: number) => <Tag color={v >= 2 ? "green" : v >= 1.5 ? "blue" : "default"}>{v}</Tag>,
          },
          {
            title: "觀察窗",
            key: "window",
            render: () => WINDOW_OPTIONS.find((w) => w.value === window)?.label,
          },
          {
            title: (
              <Tooltip title="兩項商品都買過的顧客數;數量越多統計越可靠。">
                共購顧客數
              </Tooltip>
            ),
            dataIndex: "co_customers",
            sorter: (a, b) => a.co_customers - b.co_customers,
            render: (v: number) => v.toLocaleString("en-US"),
          },
          {
            title: "建議",
            key: "advise",
            render: (_: unknown, r) => {
              const a = adviseOf(r);
              return <Tag color={a.color}>{a.label}</Tag>;
            },
          },
        ]}
      />
    </div>
  );
}
