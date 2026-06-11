import dayjs, { type Dayjs } from "dayjs";
import type { DatePreset } from "./types";

// 可選用的 Claude 模型(頁二分析中心)。
export const MODELS = [
  { value: "claude-opus-4-8", label: "Claude Opus 4.8（最強）" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6（均衡）" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5（快速）" },
];

// 快速日期選項。
export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "last_7d", label: "過去 7 天" },
  { value: "last_14d", label: "過去 14 天" },
  { value: "last_week", label: "上週" },
  { value: "this_month", label: "本月" },
  { value: "last_month", label: "上個月" },
];

// 把快速選項換算成實際日期區間。custom 回 null(由使用者自選)。
export function presetRange(preset: DatePreset): [Dayjs, Dayjs] | null {
  const today = dayjs();
  switch (preset) {
    case "last_7d":
      return [today.subtract(6, "day"), today];
    case "last_14d":
      return [today.subtract(13, "day"), today];
    case "last_week": {
      const dow = today.day(); // 0=週日 .. 6=週六
      const offsetToMon = dow === 0 ? 6 : dow - 1;
      const lastMon = today.subtract(offsetToMon + 7, "day");
      return [lastMon, lastMon.add(6, "day")];
    }
    case "this_month":
      return [today.startOf("month"), today];
    case "last_month": {
      const lm = today.subtract(1, "month");
      return [lm.startOf("month"), lm.endOf("month")];
    }
    default:
      return null;
  }
}
