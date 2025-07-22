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

import {processMessageContent} from '../utils/message-content';
import {modelStore} from '../store/model-store';
import {Message, Session} from '../store/session-store';
import dayjs from 'dayjs';

interface Elements {
  root: ShadowRoot;
  userInputContainer: HTMLElement;
  userInput: HTMLTextAreaElement;
  submitIcon: HTMLButtonElement;
  stopIcon: HTMLButtonElement;
  messagesContainer: HTMLElement;
  createButton: HTMLButtonElement;
  historyButton: HTMLButtonElement;
  historyPopup: HTMLElement;
  historyPopupContent: HTMLElement;
  historyPopupClose: HTMLButtonElement;
  modelSelect: HTMLSelectElement;
}

let elements: Elements | null = null;

const ids: Record<keyof Omit<Elements, 'root'>, string> = {
  userInputContainer: 'user-input-container',
  userInput: 'user-input',
  submitIcon: 'submit-icon',
  stopIcon: 'stop-icon',
  messagesContainer: 'messages-container',
  createButton: 'create-button',
  historyButton: 'history-button',
  historyPopup: 'history-popup',
  historyPopupContent: 'history-popup-content',
  historyPopupClose: 'history-popup-close',
  modelSelect: 'model-select',
};

export function cacheElements(root: ShadowRoot): Elements {
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

export function getElements(): Elements {
  return elements!;
}

export const messagesContainerRender = {
  // 缓存DOM模板，避免重复创建和解析HTML字符串
  _templates: {
    copyButton: null as HTMLTemplateElement | null,
    initCopyButton() {
      if (!this.copyButton) {
        const template = document.createElement('template');
        template.innerHTML = `
                    <div class="button-container">
                        <button class="icon square plain tooltip" type="button" data-action="copy">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 1024 1024"><path d="M298.667 256V128a42.667 42.667 0 0 1 42.666-42.667h512A42.667 42.667 0 0 1 896 128v597.333A42.667 42.667 0 0 1 853.333 768h-128v128c0 23.552-19.2 42.667-42.965 42.667H170.965A42.71 42.71 0 0 1 128 896l.128-597.333c0-23.552 19.2-42.667 42.923-42.667h127.616zm-85.248 85.333-.086 512H640v-512H213.419zM384 256h341.333v426.667h85.334v-512H384V256z"/></svg>
                            <span class="copied-text">Copied!</span>
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
    const buttonContainer = (template.content.cloneNode(true) as DocumentFragment)
      .firstElementChild!;

    const el = buttonContainer.querySelector('.tooltip-text')!;
    if (message.role === 'user') {
      el.classList.add('bottom-left');
    } else {
      el.classList.add('bottom-right');
    }

    return buttonContainer;
  },

  createMessage(message: Message) {
    const {role, isLoading} = message;
    const messageElement = document.createElement('div');
    messageElement.className = `message ${role}`;
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    contentContainer.innerHTML = processMessageContent(message, {showLoadingDots: isLoading});
    messageElement.appendChild(contentContainer);

    if (isLoading) {
      messageElement.classList.add('loading');
    } else {
      messageElement.appendChild(this.createCopyButton(message));
    }

    return messageElement;
  },

  addMessage(message: Message) {
    const elements = getElements();
    const messageElement = this.createMessage(message);
    elements.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  },

  replaceLoading(message: Message) {
    const elements = getElements();

    const loadingElement = elements.messagesContainer.querySelector('.message.assistant.loading');
    if (!loadingElement) return;

    const contentContainer = loadingElement.querySelector('.content-container')!;
    contentContainer.innerHTML = processMessageContent(message, {showLoadingDots: true});

    if (!loadingElement.querySelector('.button-container')) {
      loadingElement.appendChild(this.createCopyButton(message));
    }
  },

  addLoading() {
    if (this.hasLoading()) {
      return;
    }

    const elements = getElements();

    const loadingMessage: Message = {
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    const messageElement = this.createMessage(loadingMessage);
    elements.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  },

  hasLoading(): boolean {
    const elements = getElements();
    return !!elements.messagesContainer.querySelector('.message.assistant.loading');
  },

  removeLoading() {
    const elements = getElements();

    const loadingElement = elements.messagesContainer.querySelector('.message.assistant.loading');
    if (loadingElement) {
      loadingElement.classList.remove('loading');
      const loadingDots = loadingElement.querySelector('.loading-dots');
      if (loadingDots) {
        loadingDots.remove();
      }
    }
  },

  clear(): void {
    const elements = getElements();
    elements.messagesContainer.innerHTML = '';
  },

  _scrollAnimationId: null as number | null,

  scrollToBottom() {
    if (this._scrollAnimationId) {
      return;
    }

    this._scrollAnimationId = requestAnimationFrame(() => {
      const elements = getElements();
      elements.messagesContainer.scrollTo({
        top: elements.messagesContainer.scrollHeight,
        behavior: 'smooth',
      });
      this._scrollAnimationId = null;
    });
  },

  displaySession(session: Session) {
    const elements = getElements();
    const fragment = document.createDocumentFragment();
    const messages = session.messages.filter((msg) => ['user', 'assistant'].includes(msg.role));

    for (const message of messages) {
      if (!message.content) {
        continue;
      }
      const messageElement = this.createMessage(message);
      fragment.appendChild(messageElement);
    }

    elements.messagesContainer.appendChild(fragment);
    this.scrollToBottom();
  },
};

// 输入框操作
export const userInputRender = {
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
export const buttonRender = {
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

// 历史记录
export const historyRender = {
  createHistoryItem(
    session: Session,
    activeTime: number | null,
    getSessionTitle: (session: Session) => string,
  ): string {
    const isActive = activeTime === session.time;
    return `
            <div class="history-item ${isActive ? 'active' : ''}" data-time="${session.time}">
                <div class="history-item-container">
                    <div class="history-time">${dayjs(session.time).format('YYYY-MM-DD HH:mm:ss')}</div>
                    <div class="history-content">${getSessionTitle(session)}</div>
                </div>
                <button class="text square error" type="button" data-action="delete">删除</button>
            </div>
        `;
  },
  displayHistory(
    sessions: Session[],
    activeTime: number | null,
    getSessionTitle: (session: Session) => string,
  ): void {
    const elements = getElements();
    const validSessions = sessions.filter((session) =>
      session.messages.some((message) => message.role === 'user'),
    );
    elements.historyPopupContent.innerHTML =
      validSessions.length === 0
        ? '<div class="history-empty">暂无历史聊天</div>'
        : validSessions
            .map((session) => this.createHistoryItem(session, activeTime, getSessionTitle))
            .join('');
  },
  openPopup(
    sessions: Session[],
    activeTime: number | null,
    getSessionTitle: (session: Session) => string,
  ): void {
    const elements = getElements();
    this.displayHistory(sessions, activeTime, getSessionTitle);

    elements.historyPopup.classList.add('flex');

    requestAnimationFrame(() => {
      elements.historyPopup.classList.add('active');
    });
  },
  closePopup(): void {
    const elements = getElements();

    elements.historyPopup.classList.remove('active');
  },
  updateActiveItem(time: number): void {
    const items = document.querySelectorAll<HTMLElement>('.history-item');
    items.forEach((item) => {
      item.classList.toggle('active', parseInt(item.dataset.time!) === time);
    });
  },
};

export const alertRender = {
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

export const modelRender = {
  init() {
    const {modelSelect} = getElements();
    const fragment = document.createDocumentFragment();
    const {options, activeOption} = modelStore;
    for (const item of options) {
      const opt = document.createElement('option');
      opt.value = item.model;
      opt.text = item.model;
      fragment.appendChild(opt);
    }
    modelSelect.appendChild(fragment);
    modelSelect.value = activeOption!.model;
  },
};
