import { Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: description ? 6 : undefined }}>
        <div
          style={{
            width: 3,
            height: 20,
            background: "var(--color-primary)",
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        <Title level={4} style={{ marginBottom: 0, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {title}
        </Title>
      </div>
      {description && (
        <Paragraph
          type="secondary"
          style={{ marginBottom: 0, fontSize: 13, paddingLeft: 13 /* bar(3) + gap(10) */, lineHeight: 1.6 }}
        >
          {description}
        </Paragraph>
      )}
    </div>
  );
}
