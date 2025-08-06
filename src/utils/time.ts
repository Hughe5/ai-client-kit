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
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

/**
 * chrono 默认以周日为一周的开始，周六为一周的结束
 * 改成中文语境：周一为一周的开始，周日为一周的结束
 * 获取当天所在周的周一
 */
function getStartOfISOWeek() {
  return dayjs().startOf('isoWeek').toDate();
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
    const count = matched.length - 2; // "后天"的长度是 2，减去 2 剩余的就是"大"字的个数
    const daysOffset = 2 + count;
    return current.add(daysOffset, 'day').format('YYYY年MM月DD日');
  });
}

export function parseRelativeDate(text: string) {
  const processed = preprocess(text);
  const useStartOfISOWeekAsInstant = /(?:本|这|上|下)?(?:周|星期)/.test(processed);
  const result = chrono.zh.parseDate(processed, {
    instant: useStartOfISOWeekAsInstant ? getStartOfISOWeek() : new Date(),
  });
  if (result) {
    return dayjs(result).format('YYYY-MM-DD HH:mm:ss');
  }
  return '无法解析，请输入具体时间';
}
