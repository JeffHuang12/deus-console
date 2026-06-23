import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import {
  ApiOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  TeamOutlined,
  CommentOutlined,
  AlertOutlined,
  SettingOutlined,
  MessageOutlined,
  DatabaseOutlined,
  CustomerServiceOutlined,
  ExperimentOutlined,
  ShoppingOutlined,
  DeploymentUnitOutlined,
  PartitionOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  FireOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import BindingPage from "./pages/BindingPage";
import AnalysisPage from "./pages/AnalysisPage";
import AnalysisNewPage from "./pages/AnalysisNewPage";
import AnalysisDetailPage from "./pages/AnalysisDetailPage";
import AudiencePage from "./pages/AudiencePage";
import AudienceNewPage from "./pages/AudienceNewPage";
import AudienceAdBuildPage from "./pages/AudienceAdBuildPage";
import AudiencePushPage from "./pages/AudiencePushPage";
import AudienceReportPage from "./pages/AudienceReportPage";
import CommentsPage from "./pages/CommentsPage";
import MonitoringPage from "./pages/MonitoringPage";
import McpPage from "./pages/McpPage";
import PromptPage from "./pages/PromptPage";
import Ga4QueryPage from "./pages/Ga4QueryPage";
import FeatureCatalogPage from "./pages/FeatureCatalogPage";
import PredictionsPage from "./pages/PredictionsPage";
import ConversationsPage from "./pages/ConversationsPage";
import MerchandisingPage from "./pages/MerchandisingPage";
import AttributionPage from "./pages/AttributionPage";
import AiQueryPage from "./pages/AiQueryPage";
import ProductAssociationsPage from "./pages/ProductAssociationsPage";
import CreativeFatiguePage from "./pages/CreativeFatiguePage";
import NotificationsPage from "./pages/NotificationsPage";

const { Header, Sider, Content } = Layout;

// 選單分組（antd Menu children）。頁數變多後以分組維持可讀性。
const MENU: MenuProps["items"] = [
  { key: "/feature-catalog", icon: <AppstoreOutlined />, label: "功能總覽" },
  { key: "/notifications", icon: <BellOutlined />, label: "通知中心" },
  {
    key: "grp-source",
    icon: <DatabaseOutlined />,
    label: "數據源",
    children: [{ key: "/binding", icon: <ApiOutlined />, label: "數據綁定" }],
  },
  {
    key: "grp-analysis",
    icon: <BarChartOutlined />,
    label: "分析與洞察",
    children: [
      { key: "/analysis", icon: <BarChartOutlined />, label: "分析中心" },
      { key: "/ai-query", icon: <ThunderboltOutlined />, label: "AI 資料查詢" },
      { key: "/attribution", icon: <DeploymentUnitOutlined />, label: "歸因分析" },
      { key: "/creative-fatigue", icon: <FireOutlined />, label: "素材疲勞偵測" },
    ],
  },
  {
    key: "grp-audience",
    icon: <TeamOutlined />,
    label: "受眾與行銷",
    children: [{ key: "/audience", icon: <TeamOutlined />, label: "受眾管理" }],
  },
  {
    key: "grp-cs",
    icon: <CustomerServiceOutlined />,
    label: "客服與對話",
    children: [
      { key: "/comments", icon: <CommentOutlined />, label: "留言管理" },
      { key: "/conversations", icon: <CustomerServiceOutlined />, label: "客服對話中心" },
    ],
  },
  {
    key: "grp-predict",
    icon: <ExperimentOutlined />,
    label: "預測與最佳化",
    children: [
      { key: "/predictions", icon: <ExperimentOutlined />, label: "預測模型中心" },
      { key: "/merchandising", icon: <ShoppingOutlined />, label: "商品與庫存中心" },
      { key: "/product-associations", icon: <BranchesOutlined />, label: "商品關聯分析" },
    ],
  },
  {
    key: "grp-system",
    icon: <SettingOutlined />,
    label: "系統設定",
    children: [
      { key: "/monitoring", icon: <AlertOutlined />, label: "監測中心" },
      { key: "/mcp", icon: <PartitionOutlined />, label: "MCP 設定" },
      { key: "/prompt", icon: <MessageOutlined />, label: "Prompt 互動" },
    ],
  },
];

// 所有可導覽的葉節點 key（路由），供選取高亮比對。
const LEAF_KEYS = [
  "/feature-catalog",
  "/notifications",
  "/binding",
  "/analysis",
  "/ai-query",
  "/attribution",
  "/creative-fatigue",
  "/audience",
  "/comments",
  "/conversations",
  "/predictions",
  "/merchandising",
  "/product-associations",
  "/monitoring",
  "/mcp",
  "/prompt",
];

const GROUP_KEYS = [
  "grp-source",
  "grp-analysis",
  "grp-audience",
  "grp-cs",
  "grp-predict",
  "grp-system",
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const selected =
    LEAF_KEYS.find((k) => location.pathname.startsWith(k)) ?? "/feature-catalog";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0" width={220}>
        <div
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: 600,
            padding: "16px 24px",
          }}
        >
          DEUS 數據平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected]}
          defaultOpenKeys={GROUP_KEYS}
          items={MENU}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", paddingInline: 24 }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            數據綁定與分析控制台
          </span>
        </Header>
        <Content style={{ margin: 24 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/feature-catalog" replace />} />
            <Route path="/feature-catalog" element={<FeatureCatalogPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/binding" element={<BindingPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/analysis/new" element={<AnalysisNewPage />} />
            <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
            <Route path="/audience" element={<AudiencePage />} />
            <Route path="/audience/new" element={<AudienceNewPage />} />
            <Route path="/audience/:id/ad-build" element={<AudienceAdBuildPage />} />
            <Route path="/audience/:id/push" element={<AudiencePushPage />} />
            <Route path="/audience/:id/report" element={<AudienceReportPage />} />
            <Route path="/comments" element={<CommentsPage />} />
            <Route path="/conversations" element={<ConversationsPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/merchandising" element={<MerchandisingPage />} />
            <Route path="/product-associations" element={<ProductAssociationsPage />} />
            <Route path="/attribution" element={<AttributionPage />} />
            <Route path="/creative-fatigue" element={<CreativeFatiguePage />} />
            <Route path="/ai-query" element={<AiQueryPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/mcp" element={<McpPage />} />
            <Route path="/prompt" element={<PromptPage />} />
            <Route path="/ga4-query" element={<Ga4QueryPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
