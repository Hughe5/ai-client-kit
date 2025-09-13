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

import type {Message} from '../utils/agent';
import {micromark} from 'micromark';

interface Elements {
  root: ShadowRoot;
  userInputContainer: HTMLElement;
  userInput: HTMLTextAreaElement;
  submitIcon: HTMLButtonElement;
  stopIcon: HTMLButtonElement;
  messagesContainer: HTMLElement;
  createButton: HTMLButtonElement;
}

let elements: Elements | null = null;

const ids: Record<keyof Omit<Elements, 'root'>, string> = {
  userInputContainer: 'user-input-container',
  userInput: 'user-input',
  submitIcon: 'submit-icon',
  stopIcon: 'stop-icon',
  messagesContainer: 'messages-container',
  createButton: 'create-button',
};

function cacheElements(root: ShadowRoot): Elements {
  if (elements) return elements;

  elements = {} as Elements;

  elements.root = root;

  // 批量获取元素并检查是否存在
  for (const [key, id] of Object.entries(ids)) {
    const element = root.getElementById(id);
    if (!element) {
      console.warn(`Element with id '${id}' not found`);
    }
    elements[key as keyof Elements] = element as never;
  }

  return elements;
}

function getElements(): Elements {
  return elements!;
}

const messagesContainerRender = {
  // 缓存DOM模板，避免重复创建和解析HTML字符串
  _templates: {
    copyButton: null as HTMLTemplateElement | null,
    initCopyButton() {
      if (!this.copyButton) {
        const template = document.createElement('template');
        template.innerHTML = `
          <div class="button-container">
            <button class="icon square plain tooltip" type="button" data-action="copy" aria-label="复制">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 1024 1024"><path d="M298.667 256V128a42.667 42.667 0 0 1 42.666-42.667h512A42.667 42.667 0 0 1 896 128v597.333A42.667 42.667 0 0 1 853.333 768h-128v128c0 23.552-19.2 42.667-42.965 42.667H170.965A42.71 42.71 0 0 1 128 896l.128-597.333c0-23.552 19.2-42.667 42.923-42.667h127.616zm-85.248 85.333-.086 512H640v-512H213.419zM384 256h341.333v426.667h85.334v-512H384V256z"/></svg>
              <span class="copied-text">Copied</span>
              <span class="tooltip-text">复制</span>
            </button>
          </div>
        `;
        this.copyButton = template;
      }
      return this.copyButton;
    },
  },

  createCopyButton(message: Message) {
    const template = this._templates.initCopyButton();
    const clone = template.content.cloneNode(true) as DocumentFragment;
    const buttonContainer = clone.firstElementChild;
    if (!buttonContainer) {
      return null;
    }
    const el = buttonContainer.querySelector('.tooltip-text');
    if (el) {
      el.classList.add(message.role === 'user' ? 'bottom-left' : 'bottom-right');
    }

    return buttonContainer;
  },

  createMessage(message: Message) {
    const messageElement = document.createElement('div');
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    messageElement.appendChild(contentContainer);
    const button = this.createCopyButton(message);
    if (button) {
      messageElement.appendChild(button);
    }
    return messageElement;
  },

  updateMessageContent(messageElement: Element, content: string, markdown: boolean) {
    const contentContainer = messageElement.querySelector('.content-container');
    if (contentContainer) {
      contentContainer.innerHTML = markdown ? micromark(content) : content;
    }
  },

  pushMessage(message: Message | undefined) {
    if (!message) {
      return;
    }
    const {messagesContainer} = getElements();
    const {role, content} = message;
    const messageElement = this.createMessage(message);
    messageElement.className = `message ${role}`;
    this.updateMessageContent(messageElement, content, true);
    messagesContainer.appendChild(messageElement);
    /**
     * 把新加的 user message 滚动到距离顶部 12px 的位置，下面腾出来的空间用来渲染 assistant message
     * 12px 是两条 message 之间的间距，在 panel.css 里 message 的样式里
     * 一屏只展示一对 user message 和 assistant message
     */
    if (role === 'user') {
      const MARGIN_BOTTOM = 12;
      messagesContainer.scrollTo({
        top: messageElement.offsetTop - MARGIN_BOTTOM,
        behavior: 'smooth',
      });
    }
  },

  pushMessages(messages: Message[]) {
    if (!messages.length) {
      return;
    }
    for (const element of messages) {
      this.pushMessage(element);
    }
  },

  pushStreamMessage() {
    const {messagesContainer} = getElements();
    const messageElement = this.createMessage({role: 'assistant', content: ''});
    messageElement.className = 'message assistant stream';
    this.updateMessageContent(messageElement, '<p class="loading-dots"></p>', false);
    messagesContainer.appendChild(messageElement);
  },

  finishStreamMessage() {
    const {messagesContainer} = getElements();
    const messageElement = messagesContainer.querySelector('.message.assistant.stream');
    if (!messageElement) {
      return;
    }
    messageElement.classList.remove('stream');
  },

  updateStreamMessageContent(content: string) {
    const {messagesContainer} = getElements();
    const messageElement = messagesContainer.querySelector('.message.assistant.stream');
    if (!messageElement) {
      return;
    }
    this.updateMessageContent(messageElement, content, true);
  },

  clear(): void {
    const elements = getElements();
    elements.messagesContainer.innerHTML = '';
  },
};

// 输入框操作
const userInputRender = {
  get value(): string {
    const elements = getElements();
    return elements.userInput.value.trim();
  },

  set value(value: string) {
    const elements = getElements();
    elements.userInput.value = value;
  },

  clear(): void {
    const elements = getElements();
    elements.userInput.value = '';
  },

  focus(): void {
    const elements = getElements();
    elements.userInput.focus();
  },

  toggleReadOnly(value: boolean): void {
    const elements = getElements();
    elements.userInput.readOnly = value;
  },
};

// 按钮状态管理
const buttonRender = {
  // 默认状态：显示发送按钮
  default(): void {
    const {submitIcon, stopIcon} = getElements();
    submitIcon.style.display = 'flex';
    stopIcon.style.display = 'none';
  },

  // 聊天状态：只显示停止按钮
  chatting(): void {
    const {submitIcon, stopIcon} = getElements();
    submitIcon.style.display = 'none';
    stopIcon.style.display = 'flex';
  },
};

const alertRender = {
  show(text: string): void {
    const {root} = getElements();
    const el = root.querySelector('.alert');
    if (el) {
      el.remove();
    }
    const element = document.createElement('div');
    element.className = 'alert';
    element.textContent = text;
    root.appendChild(element);
    element.addEventListener('animationend', () => {
      element.remove();
    });
  },
};

export {
  cacheElements,
  getElements,
  messagesContainerRender,
  userInputRender,
  buttonRender,
  alertRender,
};
