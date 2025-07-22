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

import {Message} from '../store/session-store';
import {marked} from 'marked';

interface ProcessMessageContentOptions {
  showLoadingDots?: boolean;
}

// 使用LRU缓存机制
// class LRUCache {
//     cache = new Map();

//     constructor(maxSize = 100) {
//         this.maxSize = maxSize;
//     }

//     get(key) {
//         if (!this.has(key)) {
//             return null;
//         }
//         // 移动到最后（最新使用）
//         const value = this.cache.get(key);
//         this.cache.delete(key);
//         this.cache.set(key, value);
//         return value;
//     }

//     set(key, value) {
//         if (this.has(key)) {
//             this.cache.delete(key);
//         } else if (this.cache.size >= this.maxSize) {
//             // 删除最旧的项
//             const firstKey = this.cache.keys().next().value;
//             this.cache.delete(firstKey);
//         }
//         this.cache.set(key, value);
//     }

//     has(key) {
//         return this.cache.has(key);
//     }

//     clear() {
//         this.cache.clear();
//     }
// }

// 缓存已解析的markdown内容，避免重复解析
// const markdownCache = new LRUCache(100);

// 处理消息内容
export function processMessageContent(
  message: Message,
  options: ProcessMessageContentOptions = {},
): string {
  const {content, model} = message;
  const {showLoadingDots = false} = options;

  // 获取解析后的内容（缓存策略在函数内部自动判断）
  const parsedContent = getParsedContent(content);

  const res = showLoadingDots ? addLoadingDots(parsedContent) : parsedContent;

  // 添加模型信息
  return model ? `<p>${model}</p>${res}` : res;
}

const loadingDots = '<p class="loading-dots"></p>';

/**
 * 添加输入点到内容末尾
 * @param {string} content - 内容
 * @returns {string} 添加输入点后的内容
 */
function addLoadingDots(content: string): string {
  return content + loadingDots;
}

/**
 * 获取解析后的内容（带缓存）
 * @param {string} content - 原始内容
 * @returns {string} 解析后的内容
 */
function getParsedContent(content: string): string {
  // 检查缓存
  // if (markdownCache.has(content)) {
  //     return markdownCache.get(content);
  // }

  // 解析markdown
  const parsedContent = marked.parse(content) as string;

  // 缓存结果
  // markdownCache.set(content, parsedContent);

  return parsedContent;
}
