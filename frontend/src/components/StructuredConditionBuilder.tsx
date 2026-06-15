import {
  Button,
  DatePicker,
  InputNumber,
  Segmented,
  Select,
  Space,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  BOOL_OPTIONS,
  FIELD_GROUPS,
  OPERATORS,
  PRODUCT_OPTIONS,
  type FieldDef,
  type FieldType,
} from "../api/audienceMeta";

const { RangePicker } = DatePicker;
const { Text } = Typography;

// 條件列(內部狀態形狀,value 依型別不同)
export interface ConditionRow {
  include: boolean;
  field: string;
  operator: string;
  value: unknown;
}

export interface ConditionState {
  join: "and" | "or";
  rows: ConditionRow[];
}

// 欄位 Select 的分組選項
const FIELD_SELECT_GROUPS = FIELD_GROUPS.map((g) => ({
  label: g.group,
  options: g.fields.map((f) => ({ label: f.label, value: f.key })),
}));

const ALL_FIELDS: Record<string, FieldDef> = Object.fromEntries(
  FIELD_GROUPS.flatMap((g) => g.fields).map((f) => [f.key, f])
);

export function emptyRow(): ConditionRow {
  return { include: true, field: "", operator: "", value: null };
}

// 依欄位型別取得預設運算子
function defaultOperator(type: FieldType): string {
  return OPERATORS[type][0].value;
}

export default function StructuredConditionBuilder({
  value,
  onChange,
}: {
  value: ConditionState;
  onChange: (next: ConditionState) => void;
}) {
  const setRows = (rows: ConditionRow[]) => onChange({ ...value, rows });

  const updateRow = (idx: number, patch: Partial<ConditionRow>) => {
    setRows(value.rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const onFieldChange = (idx: number, fieldKey: string) => {
    const def = ALL_FIELDS[fieldKey];
    updateRow(idx, {
      field: fieldKey,
      operator: def ? defaultOperator(def.type) : "",
      value: null,
    });
  };

  // 依欄位型別渲染值編輯器
  const renderValue = (row: ConditionRow, idx: number) => {
    const def = ALL_FIELDS[row.field];
    if (!def) return <Text type="secondary">請先選欄位</Text>;

    switch (def.type) {
      case "bool":
        return (
          <Select
            style={{ width: 120 }}
            placeholder="值"
            options={BOOL_OPTIONS}
            value={row.value as string}
            onChange={(v) => updateRow(idx, { value: v })}
          />
        );
      case "string":
        return def.options ? (
          <Select
            style={{ width: 160 }}
            placeholder="選擇"
            options={def.options}
            value={row.value as string}
            onChange={(v) => updateRow(idx, { value: v })}
          />
        ) : (
          <InputNumber style={{ width: 160 }} disabled />
        );
      case "int":
      case "money":
        if (row.operator === "between") {
          const pair = (row.value as [number?, number?]) ?? [];
          return (
            <Space>
              <InputNumber
                placeholder="最小"
                value={pair[0]}
                onChange={(v) => updateRow(idx, { value: [v, pair[1]] })}
              />
              <span>—</span>
              <InputNumber
                placeholder="最大"
                value={pair[1]}
                onChange={(v) => updateRow(idx, { value: [pair[0], v] })}
              />
              {def.hint && <Text type="secondary">{def.hint}</Text>}
            </Space>
          );
        }
        return (
          <Space>
            <InputNumber
              style={{ width: 140 }}
              placeholder="數值"
              value={row.value as number}
              onChange={(v) => updateRow(idx, { value: v })}
            />
            {def.hint && <Text type="secondary">{def.hint}</Text>}
          </Space>
        );
      case "date":
        if (row.operator === "within_days") {
          return (
            <Space>
              <InputNumber
                placeholder="天數"
                value={row.value as number}
                onChange={(v) => updateRow(idx, { value: v })}
              />
              <Text type="secondary">天內</Text>
            </Space>
          );
        }
        return (
          <DatePicker
            value={undefined}
            onChange={(_, ds) => updateRow(idx, { value: ds })}
          />
        );
      case "order":
        return (
          <Space wrap>
            <RangePicker onChange={(_, ds) => updateRow(idx, { value: { period: ds } })} />
            <Select
              mode="multiple"
              style={{ minWidth: 200 }}
              placeholder="選擇產品"
              options={PRODUCT_OPTIONS}
              onChange={(products) =>
                updateRow(idx, {
                  value: { ...(row.value as object), products },
                })
              }
            />
          </Space>
        );
      default:
        return null;
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Space>
        <Text>組合方式:</Text>
        <Segmented
          value={value.join}
          options={[
            { label: "且(全部符合)", value: "and" },
            { label: "或(任一符合)", value: "or" },
          ]}
          onChange={(v) => onChange({ ...value, join: v as "and" | "or" })}
        />
      </Space>

      {value.rows.map((row, idx) => {
        const def = ALL_FIELDS[row.field];
        return (
          <Space key={idx} wrap align="start">
            <Select
              style={{ width: 92 }}
              value={row.include ? "include" : "exclude"}
              options={[
                { label: "包含", value: "include" },
                { label: "排除", value: "exclude" },
              ]}
              onChange={(v) => updateRow(idx, { include: v === "include" })}
            />
            <Select
              style={{ width: 180 }}
              placeholder="選擇欄位"
              options={FIELD_SELECT_GROUPS}
              value={row.field || undefined}
              onChange={(v) => onFieldChange(idx, v)}
            />
            {def && def.type !== "order" && (
              <Select
                style={{ width: 96 }}
                options={OPERATORS[def.type]}
                value={row.operator || undefined}
                onChange={(v) => updateRow(idx, { operator: v, value: null })}
              />
            )}
            {renderValue(row, idx)}
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setRows(value.rows.filter((_, i) => i !== idx))}
            />
          </Space>
        );
      })}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => setRows([...value.rows, emptyRow()])}
      >
        新增條件
      </Button>
    </Space>
  );
}
