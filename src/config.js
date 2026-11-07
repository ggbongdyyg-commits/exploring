// 所有可调常量集中在这里。
export const TZ_OFFSET_HOURS = 8; // Asia/Shanghai
export const START = { y: 2026, m: 11, d: 6 }; // 倒计时 44
export const DAYS = 44; // 11/06 .. 12/19，12/20 为 00
export const KEY_COUNT = 88;

export const NOON = 12; // 北京时间 12:00 之前为上午，之后为下午

export const STORAGE_KEY = '88keys:v2';
export const HOP_MS = 640; // 单键跃步 + 轨道平移
export const ROLL_MS = 1000; // 弧线数字换日滚动
export const CATCHUP_MS = 4500; // 补跳多键时的目标总时长
export const HOP_MIN_MS = 90; // 补跳时单步下限
