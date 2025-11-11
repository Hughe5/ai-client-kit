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

import {
  getElements,
  messagesContainerRender,
  userInputRender,
  alertRender,
  buttonRender,
} from './dom';
import {type Message, abort} from '../utils/agent';

const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const handleSend = async (): Promise<void> => {
  if (!userInputRender.value) {
    return;
  }
  try {
    const content = escapeHtml(userInputRender.value);
    buttonRender.chatting();
    userInputRender.clear();
    const message: Message = {role: 'user', content};
    messagesContainerRender.pushMessage(message);
    await eventManager.emit('send', message);
  } finally {
    buttonRender.default();
    userInputRender.focus();
  }
};

// 处理停止按钮点击事件
const handleStop = (): void => {
  abort();
  buttonRender.default();
  userInputRender.focus();
};

// 创建新聊天
const handleCreate = async (): Promise<void> => {
  messagesContainerRender.clear();
  alertRender.show('新聊天已创建');
  userInputRender.focus();
  await eventManager.emit('create');
};

// 初始化事件监听器
function bindEvents(): void {
  const {submitIcon, createButton, messagesContainer, userInputContainer, userInput, stopIcon} =
    getElements();

  userInputContainer.addEventListener('click', (e: MouseEvent) => {
    if (!submitIcon.contains(e.target as Node) && !stopIcon.contains(e.target as Node)) {
      userInputRender.focus();
    }
  });

  userInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // 发送按钮点击事件
  submitIcon.addEventListener('click', handleSend);

  // 停止按钮点击事件
  stopIcon.addEventListener('click', handleStop);

  createButton.addEventListener('click', handleCreate);

  // Event Delegation for Copy Buttons
  messagesContainer.addEventListener('click', function (event: MouseEvent) {
    const target = event.target as HTMLElement;
    const copyButton = target.closest<HTMLElement>('[data-action="copy"]');
    const reasoningHeader = target.closest<HTMLElement>('.reasoning-header');
    if (copyButton && !copyButton.classList.contains('copied')) {
      event.stopPropagation();
      const messageElement = copyButton.closest<HTMLElement>('.message');
      if (!messageElement) {
        return;
      }
      const contentContainer = messageElement.querySelector<HTMLElement>('.content-container');
      if (!contentContainer) {
        return;
      }
      const text = contentContainer.textContent;
      if (!text) {
        return;
      }
      copyButton.classList.add('copied');
      navigator.clipboard
        .writeText(text)
        .catch((err) => {
          console.error('Failed to copy text: ', err);
        })
        .finally(() => {
          setTimeout(() => {
            copyButton.classList.remove('copied');
          }, 1500);
        });
    }
    if (reasoningHeader) {
      const reasoningContainer = reasoningHeader.parentElement;
      if (reasoningContainer) {
        reasoningContainer.classList.toggle('collapse');
      }
    }
  });
}

type EventType = 'send' | 'create';

type EventParams = {
  send: [message: Message];
  create: []; // 空数组表示无参数
};

type EventListener<T extends EventType> = (...args: EventParams[T]) => void | Promise<void>;

class EventManager {
  private events: {
    [K in EventType]: EventListener<K>[];
  } = {
    send: [],
    create: [],
  };

  on = <T extends EventType>(type: T, listener: EventListener<T>): void => {
    this.events[type].push(listener);
  };

  emit = async <T extends EventType>(type: T, ...args: EventParams[T]): Promise<void> => {
    for (const listener of this.events[type]) {
      try {
        await listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${type}:`, error);
      }
    }
  };
}

const eventManager = new EventManager();

export {bindEvents, eventManager};
