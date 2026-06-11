import { Tag } from "antd";
import type { ConnectionStatus } from "../api/types";

// 連線狀態標籤。
export default function StatusTag({ status }: { status: ConnectionStatus }) {
  return status === "connected" ? (
    <Tag color="green">已連線</Tag>
  ) : (
    <Tag color="default">未連線</Tag>
  );
}
