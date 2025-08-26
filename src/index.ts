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

import {messagesContainerRender} from './view/dom';
import {eventManager} from './view/event';
import {initView} from './view/index';
import {template} from './view/template';
import {tools} from './store/tools';
import {Agent, Message} from './utils/agent';

class Panel extends HTMLElement {
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

customElements.define('ai-chat-panel', Panel);

interface Config {
  container: HTMLElement | null;
}

class AIChatPanel {
  on = eventManager.on.bind(eventManager);
  constructor(config: Config) {
    const {container} = config;
    if (!container) {
      return;
    }
    const element = document.createElement('ai-chat-panel');
    container.appendChild(element);
  }
  pushMessages(messages: Message[]) {
    if (!messages.length) {
      return;
    }
    for (const element of messages) {
      messagesContainerRender.pushMessage(element);
    }
  }
}

export {tools, Agent, AIChatPanel};
