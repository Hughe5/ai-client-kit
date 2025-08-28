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

const handleSend = async (): Promise<void> => {
  const userInput = userInputRender.value;
  if (!userInput) {
    return;
  }
  try {
    buttonRender.chatting();
    userInputRender.clear();
    userInputRender.toggleReadOnly(true);
    // 将 HTML 标签转换为 Markdown 行内代码块
    const processedContent = userInput.replace(/<([^>]+)>/g, '`<$1>`');
    const userMessage: Message = {role: 'user', content: processedContent};
    messagesContainerRender.pushMessage(userMessage);
    await eventManager.emit('send', userMessage);
  } finally {
    buttonRender.default();
    userInputRender.toggleReadOnly(false);
    userInputRender.focus();
  }
};

// 处理停止按钮点击事件
const handleStop = (): void => {
  abort();
  buttonRender.default();
  userInputRender.toggleReadOnly(false);
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
export function bindEvents(): void {
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
  });
}

type EventType = 'send' | 'create';

type EventListener = (args?: any) => void | Promise<void>;

class EventManager {
  private events: Record<EventType, EventListener[]> = {
    send: [],
    create: [],
  };

  on(type: EventType, listener: EventListener) {
    this.events[type].push(listener);
  }

  async emit(type: EventType, args?: any) {
    for (const listener of this.events[type]) {
      try {
        await listener(args);
      } catch (error) {
        console.error(`Error in event listener for ${type}:`, error);
      }
    }
  }
}

export const eventManager = new EventManager();
