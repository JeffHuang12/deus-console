import { useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { api } from "../api/client";
import { DATE_PRESETS, MODELS, presetRange } from "../api/presets";
import type {
  CompareMode,
  DataSource,
  DatePreset,
  ReportConfig,
  SavedReport,
} from "../api/types";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const COMPARE_OPTIONS: { label: string; value: CompareMode }[] = [
  { label: "對比前期", value: "prev_period" },
  { label: "對比去年同期", value: "yoy" },
];

// 分析中心上方控制列:日期、資料源、模型、Prompt、對比基準、常用報表。
export default function AnalysisControls({
  onRun,
  loading,
}: {
  onRun: (config: ReportConfig) => void;
  loading: boolean;
}) {
  const [preset, setPreset] = useState<DatePreset>("last_7d");
  const [range, setRange] = useState<[Dayjs, Dayjs]>(
    presetRange("last_7d") as [Dayjs, Dayjs]
  );
  const [sourceOptions, setSourceOptions] = useState<DataSource[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [model, setModel] = useState(MODELS[0].value);
  const [prompt, setPrompt] = useState("");
  const [compareMode, setCompareMode] = useState<CompareMode>("prev_period");

  const [saved, setSaved] = useState<SavedReport[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [scheduleDaily, setScheduleDaily] = useState(true);

  const buildConfig = (): ReportConfig => ({
    date_preset: preset,
    start_date: range ? range[0].format("YYYY-MM-DD") : null,
    end_date: range ? range[1].format("YYYY-MM-DD") : null,
    sources,
    model,
    prompt: prompt.trim() || null,
    compare_mode: compareMode,
  });

  const reloadSaved = () => api.listSavedReports().then(setSaved);

  useEffect(() => {
    api.listSources().then(setSourceOptions);
    reloadSaved();
    onRun(buildConfig()); // 進頁面即以預設設定產生一份報告
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPreset = (value: DatePreset) => {
    setPreset(value);
    const r = presetRange(value);
    if (r) setRange(r);
  };

  const applyConfig = (cfg: ReportConfig) => {
    setPreset(cfg.date_preset);
    if (cfg.start_date && cfg.end_date) {
      setRange([dayjs(cfg.start_date), dayjs(cfg.end_date)]);
    } else {
      const r = presetRange(cfg.date_preset);
      if (r) setRange(r);
    }
    setSources(cfg.sources);
    setModel(cfg.model);
    setPrompt(cfg.prompt ?? "");
    setCompareMode(cfg.compare_mode);
    onRun(cfg);
  };

  const doSave = async () => {
    if (!saveName.trim()) {
      message.warning("請輸入報表名稱");
      return;
    }
    await api.saveReport(saveName.trim(), buildConfig(), scheduleDaily);
    message.success("已存為常用報表");
    setSaveOpen(false);
    setSaveName("");
    reloadSaved();
  };

  const removeSaved = async (id: number) => {
    await api.deleteSavedReport(id);
    reloadSaved();
  };

  return (
    <Card title="報表設定" style={{ marginBottom: 16 }}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space wrap align="center">
          <Text>日期：</Text>
          <RangePicker
            value={range}
            onChange={(v) => {
              if (v && v[0] && v[1]) {
                setRange([v[0], v[1]]);
                setPreset("custom");
              }
            }}
          />
          <Segmented
            value={preset}
            options={DATE_PRESETS}
            onChange={(v) => onPreset(v as DatePreset)}
          />
        </Space>

        <Space wrap align="center">
          <Text>資料來源：</Text>
          <Select
            mode="multiple"
            allowClear
            placeholder="預設全部資料源"
            style={{ minWidth: 280 }}
            value={sources}
            onChange={setSources}
            options={sourceOptions.map((s) => ({ label: s.name, value: s.id }))}
          />
          <Text>模型：</Text>
          <Select
            style={{ width: 220 }}
            value={model}
            onChange={setModel}
            options={MODELS}
          />
          <Text>整體數據總覽對比：</Text>
          <Select
            style={{ width: 160 }}
            value={compareMode}
            onChange={(v) => setCompareMode(v as CompareMode)}
            options={COMPARE_OPTIONS}
          />
        </Space>

        <div>
          <Text>自訂 Prompt（選填）：</Text>
          <Input.TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如:聚焦在 Meta 廣告的成效,並針對客單價下滑提出建議"
            autoSize={{ minRows: 2, maxRows: 4 }}
            style={{ marginTop: 8 }}
          />
        </div>

        <Space wrap>
          <Button type="primary" loading={loading} onClick={() => onRun(buildConfig())}>
            產生分析
          </Button>
          <Button onClick={() => setSaveOpen(true)}>存為常用報表</Button>
        </Space>

        {saved.length > 0 && (
          <div>
            <Text type="secondary">常用報表（每日自動更新）：</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                {saved.map((s) => (
                  <Tag
                    key={s.id}
                    color="blue"
                    closable
                    onClose={(e) => {
                      e.preventDefault();
                      removeSaved(s.id);
                    }}
                    onClick={() => applyConfig(s.config)}
                    style={{ cursor: "pointer", padding: "2px 8px" }}
                  >
                    {s.name}
                    {s.schedule_daily ? "（每日）" : ""}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        )}
      </Space>

      <Modal
        title="存為常用報表"
        open={saveOpen}
        onOk={doSave}
        onCancel={() => setSaveOpen(false)}
        okText="儲存"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="報表名稱,例如:每日成效總覽"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
          />
          <Space>
            <Switch checked={scheduleDaily} onChange={setScheduleDaily} />
            <Text>每天自動更新</Text>
          </Space>
        </Space>
      </Modal>
    </Card>
  );
}
