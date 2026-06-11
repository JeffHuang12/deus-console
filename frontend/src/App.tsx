import { Layout, Menu } from "antd";
import {
  ApiOutlined,
  BarChartOutlined,
  AlertOutlined,
  SettingOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import BindingPage from "./pages/BindingPage";
import AnalysisPage from "./pages/AnalysisPage";
import MonitoringPage from "./pages/MonitoringPage";
import McpPage from "./pages/McpPage";
import PromptPage from "./pages/PromptPage";

const { Header, Sider, Content } = Layout;

const MENU = [
  { key: "/binding", icon: <ApiOutlined />, label: "數據綁定" },
  { key: "/analysis", icon: <BarChartOutlined />, label: "分析中心" },
  { key: "/monitoring", icon: <AlertOutlined />, label: "監測中心" },
  { key: "/mcp", icon: <SettingOutlined />, label: "MCP 設定" },
  { key: "/prompt", icon: <MessageOutlined />, label: "Prompt 互動" },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const selected = MENU.find((m) => location.pathname.startsWith(m.key))?.key ?? "/binding";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
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
            <Route path="/" element={<Navigate to="/binding" replace />} />
            <Route path="/binding" element={<BindingPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/mcp" element={<McpPage />} />
            <Route path="/prompt" element={<PromptPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
