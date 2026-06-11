import { Typography } from "antd";

const { Title, Paragraph } = Typography;

// 各頁標題列。
export default function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Title level={3} style={{ marginBottom: 4 }}>
        {title}
      </Title>
      {description && (
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {description}
        </Paragraph>
      )}
    </div>
  );
}
