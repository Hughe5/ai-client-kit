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
  historyRender,
  alertRender,
  buttonRender,
} from './dom';
import {chat, handleCancel} from '../utils/chat';
import {sessionStore, Message} from '../store/session-store';
import {modelStore} from '../store/model-store';

const handleSubmit = async (): Promise<void> => {
  const userInput = userInputRender.value;
  if (!userInput) {
    return;
  }
  try {
    buttonRender.chatting();
    userInputRender.toggleReadOnly(true);
    // 将 HTML 标签转换为 Markdown 行内代码块
    const processedContent = userInput.replace(/<([^>]+)>/g, '`<$1>`');
    const userMessage: Message = {role: 'user', content: processedContent};
    sessionStore.addMessage(userMessage);
    messagesContainerRender.addMessage(userMessage);
    await chat();
  } finally {
    buttonRender.default();
    userInputRender.toggleReadOnly(false);
    userInputRender.focus();
  }
};

// 处理停止按钮点击事件
const handleStop = (): void => {
  handleCancel();
  buttonRender.default();
  userInputRender.toggleReadOnly(false);
  userInputRender.focus();
};

// 创建新聊天
function handleCreate(): void {
  sessionStore.createSession();
  messagesContainerRender.clear();
  alertRender.show('新聊天已创建');
  userInputRender.focus();
}

// 显示历史记录
function handleOpenHistoryPopup(): void {
  historyRender.openPopup(
    sessionStore.sessions,
    sessionStore.activeTime,
    sessionStore.getSessionTitle,
  );
}

// 切换历史记录
function handleSwitchToHistory(time: number): void {
  const selectedSession = sessionStore.switchSession(time);

  // 清空当前消息容器
  messagesContainerRender.clear();
  // 显示选中的历史记录
  messagesContainerRender.displaySession(selectedSession);

  // 更新选中态样式
  historyRender.updateActiveItem(selectedSession.time);

  // 关闭历史记录弹窗
  // historyRender.closePopup();
}

// 初始化事件监听器
export function bindEvents(): void {
  const {
    submitIcon,
    createButton,
    historyButton,
    historyPopupClose,
    messagesContainer,
    userInputContainer,
    userInput,
    historyPopup,
    historyPopupContent,
    modelSelect,
    stopIcon,
  } = getElements();

  userInputContainer.addEventListener('click', (e: MouseEvent) => {
    if (!submitIcon.contains(e.target as Node) && !stopIcon.contains(e.target as Node)) {
      userInputRender.focus();
    }
  });

  userInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  });

  // 发送按钮点击事件
  submitIcon.addEventListener('click', handleSubmit);

  // 停止按钮点击事件
  stopIcon.addEventListener('click', handleStop);

  createButton.addEventListener('click', handleCreate);

  historyButton.addEventListener('click', handleOpenHistoryPopup);

  historyPopupClose.addEventListener('click', historyRender.closePopup);

  // 绑定 history-item 点击事件
  historyPopupContent.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const historyItem = target.closest<HTMLElement>('.history-item');
    if (historyItem?.dataset.time) {
      const time = parseInt(historyItem.dataset.time);
      if (target.dataset.action === 'delete') {
        // 删除对应的历史记录
        sessionStore.deleteSession(time);
        if (historyItem.classList.contains('active')) {
          handleCreate();
        }
        historyRender.displayHistory(
          sessionStore.sessions,
          sessionStore.activeTime,
          sessionStore.getSessionTitle,
        );
      } else {
        handleSwitchToHistory(time);
      }
    }
  });

  historyPopup.addEventListener('transitionend', () => {
    if (historyPopup.classList.contains('active')) {
      return;
    }
    historyPopup.classList.remove('flex');
  });

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

  modelSelect.addEventListener('change', (e: Event) => {
    const target = e.target as HTMLSelectElement;
    modelStore.updateActiveOption(target.value);
  });
}
