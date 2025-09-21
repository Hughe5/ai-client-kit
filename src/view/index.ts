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

import {cacheElements, messagesContainerRender} from './dom';
import {bindEvents} from './event';

export const init = (root: ShadowRoot): void => {
  // 缓存DOM元素
  cacheElements(root);

  // 初始化事件监听器
  bindEvents();

  // 设置 messagesContainer paddingBottom
  messagesContainerRender.setPaddingBottom();
};
