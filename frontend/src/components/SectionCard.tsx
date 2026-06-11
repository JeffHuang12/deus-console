import { Card } from "antd";
import type { ReactNode } from "react";

// 分析中心各區塊的容器。index 用於顯示「0. / 1.」前綴。
export default function SectionCard({
  index,
  title,
  extra,
  children,
}: {
  index: number;
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card
      title={`${index}. ${title}`}
      extra={extra}
      style={{ marginBottom: 16 }}
    >
      {children}
    </Card>
  );
}
