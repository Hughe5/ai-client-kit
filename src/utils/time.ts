/**
 * Copyright 2025 Hughe5
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as chrono from 'chrono-node';
import dayjs from 'dayjs';

/**
 * chrono 默认以周日为一周的开始，周六为一周的结束
 * 改成中文语境：周一为一周的开始，周日为一周的结束
 * 获取当天所在周的周一
 */
function getStartOfWeek() {
  const date = new Date();
  const day = date.getDay(); // 0 (周日) ~ 6 (周六)
  const diff = day === 0 ? -6 : 1 - day; // 周日→-6，周一→0，其它以此类推
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(12, 0, 0, 0); // 避免跨天影响
  return monday;
}
/**
 * 预处理
 * 扩展 chrono 不支持的相对时间
 * 后天、大后天、大大后天 ...
 */
const PATTERN = /大*后天/g;
function preprocess(text: string): string {
  // 快速跳过无匹配文本
  if (!PATTERN.test(text)) {
    return text;
  }

  const current = dayjs(); // 只调用一次
  // 重置 lastIndex，因为 test 会修改它（正则有全局标志 g）
  PATTERN.lastIndex = 0;

  return text.replace(PATTERN, (matched) => {
    const count = matched.length - 2; // "后天" 长度是 2，多的都是 "大"
    const daysOffset = 2 + count;
    return current.add(daysOffset, 'day').format('YYYY年MM月DD日');
  });
}
export function parseRelativeDate(text: string) {
  const processed = preprocess(text);
  const shouldUseStart = /本周|下周|周|星期[一二三四五六日天]/.test(processed);
  const ref = getStartOfWeek();
  const result = chrono.zh.parseDate(processed, {instant: shouldUseStart ? ref : new Date()});
  if (result) {
    return dayjs(result).format('YYYY-MM-DD HH:mm:ss');
  }
  return '无法解析，请输入具体时间';
}
