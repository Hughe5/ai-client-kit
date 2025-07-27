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

import {template} from './view/template';
import {initView} from './view/index';
import {ModelOption, modelStore} from './store/model-store';
import {sessionStore} from './store/session-store';
import {toolStore, Tool} from './store/tool-store';
import {tools} from './store/tools';

class AIChatPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  connectedCallback() {
    // 元素插入 DOM 后，做初始化
    if (this.shadowRoot) {
      initView(this.shadowRoot);
    }
  }
}

customElements.define('ai-chat-panel', AIChatPanel);

interface AIChatPanelConfig {
  modelOptions: ModelOption[];
  container: HTMLElement;
  systemMessageContent?: string;
}

const initAIChatPanel = (config: AIChatPanelConfig): void => {
  const {modelOptions, container, systemMessageContent} = config;
  modelStore.init(modelOptions);
  container.appendChild(document.createElement('ai-chat-panel'));
  if (systemMessageContent) {
    sessionStore.updateSystemMessageContent(systemMessageContent);
  }
};

const registerTools: (tools: Tool<any>[]) => void = toolStore.register.bind(toolStore);

export {initAIChatPanel, registerTools, tools};
