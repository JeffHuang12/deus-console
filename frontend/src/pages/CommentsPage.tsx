import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
  List,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { MessageOutlined } from "@ant-design/icons";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import type { Comment } from "../api/types";

const { Text } = Typography;

const TAG_COLOR: Record<string, string> = {
  正面: "green",
  負面: "red",
  產品: "blue",
  客服: "purple",
  物流: "orange",
};

const ALL_TAGS = ["正面", "負面", "產品", "客服", "物流"];

// 依留言標籤產生自動回覆草稿(本期 mock,Phase 2 由 LLM 生成)
function draftReply(c: Comment): string {
  if (c.tags.includes("負面")) {
    return "很抱歉造成您的不便,我們已收到您的回饋並會盡快改善。方便的話請私訊訂單編號,讓我們協助處理。";
  }
  if (c.tags.includes("正面")) {
    return "感謝您的支持與分享!很開心您喜歡,期待再次為您服務。";
  }
  if (c.tags.includes("客服")) {
    return "您好,已為您記錄此問題,客服會盡快與您聯繫說明,謝謝您的耐心。";
  }
  return "感謝您的留言,我們已收到您的意見並會持續優化。";
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [platform, setPlatform] = useState<string>();
  const [postUrl, setPostUrl] = useState<string>();
  const [tags, setTags] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({}); // 可編輯的 AI 回覆

  useEffect(() => {
    api.getComments().then(setComments);
  }, []);

  const platformOptions = useMemo(
    () => Array.from(new Set(comments.map((c) => c.platform))).map((p) => ({ label: p, value: p })),
    [comments]
  );
  const postOptions = useMemo(
    () => Array.from(new Set(comments.map((c) => c.post_url))).map((u) => ({ label: u, value: u })),
    [comments]
  );

  const filtered = useMemo(
    () =>
      comments.filter(
        (c) =>
          (!platform || c.platform === platform) &&
          (!postUrl || c.post_url === postUrl) &&
          (tags.length === 0 || tags.some((t) => c.tags.includes(t)))
      ),
    [comments, platform, postUrl, tags]
  );

  const selectedComments = comments.filter((c) => selectedKeys.includes(c.id));

  // 開啟回覆視窗:先用 AI 草稿預填,供使用者編輯
  const openReply = () => {
    const init: Record<string, string> = {};
    selectedComments.forEach((c) => {
      init[c.id] = draftReply(c);
    });
    setDrafts(init);
    setModalOpen(true);
  };

  const doReply = async () => {
    setReplying(true);
    try {
      const res = await api.replyComments(selectedKeys);
      message.success(`已對 ${res.replied} 則留言送出自動回覆`);
      setModalOpen(false);
      setSelectedKeys([]);
    } finally {
      setReplying(false);
    }
  };

  const columns = [
    { title: "留言", dataIndex: "text", width: 240 },
    {
      title: "貼文網址",
      dataIndex: "post_url",
      sorter: (a: Comment, b: Comment) => a.post_url.localeCompare(b.post_url),
      render: (u: string) => (
        <a href={u} target="_blank" rel="noreferrer">
          {u}
        </a>
      ),
    },
    {
      title: "貼文平台",
      dataIndex: "platform",
      sorter: (a: Comment, b: Comment) => a.platform.localeCompare(b.platform),
    },
    {
      title: "標籤",
      dataIndex: "tags",
      render: (ts: string[]) => ts.map((t) => <Tag key={t} color={TAG_COLOR[t]}>{t}</Tag>),
    },
    {
      title: "留言數量",
      dataIndex: "comment_count",
      sorter: (a: Comment, b: Comment) => a.comment_count - b.comment_count,
    },
    {
      title: "互動次數",
      dataIndex: "interaction_count",
      sorter: (a: Comment, b: Comment) => a.interaction_count - b.interaction_count,
    },
  ];

  return (
    <div>
      <PageHeader
        title="留言管理"
        description="檢視各平台貼文留言,依平台、貼文、標籤篩選,可多選後對選取的留言自動回覆。本期資料為示範值。"
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap align="center">
          <Text>平台:</Text>
          <Select
            allowClear
            placeholder="全部平台"
            style={{ width: 160 }}
            options={platformOptions}
            value={platform}
            onChange={setPlatform}
          />
          <Text>貼文連結:</Text>
          <Select
            allowClear
            placeholder="全部貼文"
            style={{ minWidth: 280 }}
            options={postOptions}
            value={postUrl}
            onChange={setPostUrl}
          />
          <Text>標籤:</Text>
          <Select
            mode="multiple"
            allowClear
            placeholder="全部標籤"
            style={{ minWidth: 220 }}
            options={ALL_TAGS.map((t) => ({ label: t, value: t }))}
            value={tags}
            onChange={setTags}
          />
        </Space>
      </Card>

      <div style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          icon={<MessageOutlined />}
          disabled={selectedKeys.length === 0}
          onClick={openReply}
        >
          自動回覆{selectedKeys.length > 0 ? `(${selectedKeys.length})` : ""}
        </Button>
      </div>

      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={filtered}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys as string[]),
        }}
      />

      <Modal
        title={`自動回覆(${selectedComments.length} 則)`}
        open={modalOpen}
        onOk={doReply}
        onCancel={() => setModalOpen(false)}
        okText="送出回覆"
        cancelText="取消"
        confirmLoading={replying}
        width={640}
      >
        <Text type="secondary">以下為依留言內容自動產生的回覆草稿(Phase 2 由 Claude API 生成),可直接編輯後送出:</Text>
        <List
          style={{ marginTop: 12 }}
          dataSource={selectedComments}
          renderItem={(c) => (
            <List.Item>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Space wrap>
                  <Tag>{c.platform}</Tag>
                  {c.tags.map((t) => (
                    <Tag key={t} color={TAG_COLOR[t]}>{t}</Tag>
                  ))}
                </Space>
                <Text>留言:{c.text}</Text>
                <Input.TextArea
                  autoSize={{ minRows: 2, maxRows: 5 }}
                  value={drafts[c.id]}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                  }
                />
              </Space>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
