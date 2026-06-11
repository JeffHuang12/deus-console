import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type { McpServer } from "../api/types";

export default function McpPage() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [form] = Form.useForm();

  const reload = () => api.listServers().then(setServers);

  useEffect(() => {
    reload();
  }, []);

  const onCreate = async (values: any) => {
    await api.createServer({ enabled: true, ...values });
    message.success("已新增 MCP server");
    form.resetFields();
    reload();
  };

  const toggle = async (s: McpServer, enabled: boolean) => {
    await api.updateServer(s.id, { name: s.name, command: s.command, enabled });
    reload();
  };

  const remove = async (id: number) => {
    await api.deleteServer(id);
    message.success("已刪除");
    reload();
  };

  const columns = [
    { title: "名稱", dataIndex: "name" },
    { title: "啟動指令 / URL", dataIndex: "command" },
    {
      title: "狀態",
      dataIndex: "status",
      render: (v: McpServer["status"]) =>
        v === "online" ? (
          <Tag color="green">線上</Tag>
        ) : (
          <Tag color="default">離線</Tag>
        ),
    },
    {
      title: "啟用",
      dataIndex: "enabled",
      render: (v: boolean, r: McpServer) => (
        <Switch checked={v} onChange={(c) => toggle(r, c)} />
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, r: McpServer) => (
        <Popconfirm title="確認刪除這個 MCP server?" onConfirm={() => remove(r.id)}>
          <Button danger size="small">
            刪除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="MCP 設定"
        description="管理可用的 MCP server。本期設定暫存於後端記憶體,實際連線探測於後續接通。"
      />

      <Card title="新增 MCP Server" style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline" onFinish={onCreate}>
          <Form.Item name="name" label="名稱" rules={[{ required: true }]}>
            <Input placeholder="例如 filesystem" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item
            name="command"
            label="啟動指令 / URL"
            rules={[{ required: true }]}
          >
            <Input placeholder="例如 npx -y ..." style={{ width: 320 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              新增
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="已設定的 MCP Server">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={servers}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
