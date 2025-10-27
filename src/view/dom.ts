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
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import {visit} from 'unist-util-visit';
import type {Root, Code, InlineCode} from 'mdast';
import type {Plugin} from 'prettier';
import * as prettier from 'prettier/standalone';
import parserBabel from 'prettier/plugins/babel';
import parserEstree from 'prettier/plugins/estree'; // 必须和 parserBabel 配合
import parserHtml from 'prettier/plugins/html';
import parserPostcss from 'prettier/plugins/postcss';
import parserMarkdown from 'prettier/plugins/markdown';
import DOMPurify from 'dompurify';

// 语言对应 parser + 插件
const parserMap = new Map<string, {parser: string; plugins?: Plugin[]}>([
  ['javascript', {parser: 'babel', plugins: [parserBabel, parserEstree]}],
  ['js', {parser: 'babel', plugins: [parserBabel, parserEstree]}],
  ['typescript', {parser: 'babel-ts', plugins: [parserBabel, parserEstree]}],
  ['ts', {parser: 'babel-ts', plugins: [parserBabel, parserEstree]}],
  ['html', {parser: 'html', plugins: [parserHtml]}],
  ['css', {parser: 'css', plugins: [parserPostcss]}],
  ['scss', {parser: 'css', plugins: [parserPostcss]}],
  ['markdown', {parser: 'markdown', plugins: [parserMarkdown]}],
]);

function remarkPrettier() {
  return async (tree: Root) => {
    const promises: Promise<void>[] = [];

    //  fenced code
    visit(tree, 'code', (node: Code) => {
      const lang = node.lang;
      if (!lang) {
        return;
      }
      const config = parserMap.get(lang);
      if (!config) {
        return;
      }
      const {parser, plugins} = config;

      promises.push(
        prettier
          .format(node.value, {
            parser,
            plugins,
          })
          .then((formatted) => {
            node.value = formatted;
          })
          .catch((e) => {
            console.warn(`${lang} 格式化失败:`, e);
          }),
      );
    });

    /**
     * 格式化下面这样的代码
     * <td><code>js&lt;br&gt;const [file] = await window.showOpenFilePicker();&lt;br&gt;const data = await file.getFile().then(f =&gt; f.text());&lt;br&gt;</code></td>
     */
    visit(tree, 'inlineCode', (node: InlineCode, index, parent) => {
      if (index === undefined || !parent) {
        return;
      }
      const brTag = /<br\s*\/?>/i;
      if (!brTag.test(node.value)) {
        return;
      }
      const parts = node.value.split(brTag);
      const lang = parts.shift();
      if (!lang) {
        return;
      }
      const config = parserMap.get(lang);
      if (!config) {
        return;
      }
      const {parser, plugins} = config;
      const code = parts.join('\n');

      promises.push(
        prettier
          .format(code, {
            parser,
            plugins,
          })
          .then((formatted) => {
            parent.children[index] = {
              type: 'code',
              lang,
              value: formatted,
            };
          })
          .catch((e) => {
            console.warn(`${lang} 格式化失败:`, e);
          }),
      );
    });

    await Promise.all(promises);
  };
}

// Markdown -> HTML
async function parseMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse) // Markdown -> AST
    .use(remarkGfm) // 支持 GFM 特性
    .use(remarkPrettier) // 格式化 code
    .use(remarkRehype, {allowDangerousHtml: true}) // Markdown AST -> HTML AST
    .use(rehypeStringify, {allowDangerousHtml: true}) // HTML AST -> HTML string
    .process(markdown);

  const dirty = String(file);

  return DOMPurify.sanitize(dirty);
}

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

class MessagesContainerRender {
  #templates = {
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
    reasoningContainer: null as HTMLTemplateElement | null,
    initReasoningContainer() {
      if (!this.reasoningContainer) {
        const template = document.createElement('template');
        template.innerHTML = `
          <div class="reasoning-container collapse">
            <div class="reasoning-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 1024 1024"><path d="M724.48 521.728c-1.8432 7.7824-5.7344 14.848-11.3664 20.48l-341.9136 342.016c-16.6912 16.6912-43.7248 16.6912-60.3136 0s-16.6912-43.7248 0-60.3136L622.6944 512 310.8864 200.0896c-16.6912-16.6912-16.6912-43.7248 0-60.3136 16.6912-16.6912 43.7248-16.6912 60.3136 0l341.9136 341.9136c10.8544 10.8544 14.6432 26.112 11.3664 40.0384z" fill="currentColor"/></svg>
              思考过程
            </div>
            <div class="reasoning-content"></div>
          </div>
        `;
        this.reasoningContainer = template;
      }
      return this.reasoningContainer;
    },
  };

  #height = 0;
  #animationId: number | null = null;
  #observer: ResizeObserver | null = null;

  createCopyButton(message: Message) {
    const template = this.#templates.initCopyButton();
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
  }

  createMessage(message: Message) {
    const messageElement = document.createElement('div');
    const bodyContainer = document.createElement('div');
    bodyContainer.className = 'body-container';
    messageElement.appendChild(bodyContainer);
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    bodyContainer.appendChild(contentContainer);
    const button = this.createCopyButton(message);
    if (button) {
      messageElement.appendChild(button);
    }
    return messageElement;
  }

  updateMessageContent(messageElement: Element, content: string) {
    const contentContainer = messageElement.querySelector('.content-container');
    if (!contentContainer) {
      return;
    }
    requestAnimationFrame(async () => {
      const parsed = await parseMarkdown(content);
      contentContainer.innerHTML = parsed;
    });
  }

  pushMessage = (message: Message | undefined) => {
    if (!message) {
      return;
    }
    const {messagesContainer} = getElements();
    const {role, content} = message;
    const messageElement = this.createMessage(message);
    messageElement.className = `message ${role}`;
    this.updateMessageContent(messageElement, content);
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
  };

  pushMessages = (messages: Message[]) => {
    if (!messages.length) {
      return;
    }
    for (const element of messages) {
      this.pushMessage(element);
    }
  };

  pushLoadingMessage = () => {
    const {messagesContainer} = getElements();
    const messageElement = this.createMessage({
      role: 'assistant',
      content: '',
    });
    messageElement.className = 'message assistant loading';
    const bodyContainer = messageElement.querySelector('.body-container');
    if (!bodyContainer) {
      return;
    }
    const loadingElement = document.createElement('p');
    loadingElement.className = 'loading-dots';
    bodyContainer.appendChild(loadingElement);
    messagesContainer.appendChild(messageElement);
  };

  finishLoadingMessage = () => {
    const {messagesContainer} = getElements();
    /**
     * 这里必须使用 requestAnimationFrame
     * 因为 updateMessageContent 里已经使用了 requestAnimationFrame
     * 确保 finishLoadingMessage 在最后一次的 updateMessageContent 执行之后再执行
     */
    requestAnimationFrame(() => {
      const messageElement = messagesContainer.querySelector('.message.assistant.loading');
      if (!messageElement) {
        return;
      }
      messageElement.classList.remove('loading');
      const loadingElement = messageElement.querySelector('.loading-dots');
      loadingElement?.remove();
    });
  };

  updateLoadingMessageContent = (content: string) => {
    const {messagesContainer} = getElements();
    const messageElement = messagesContainer.querySelector('.message.assistant.loading');
    if (!messageElement) {
      return;
    }
    this.updateMessageContent(messageElement, content);
  };

  updateLoadingMessageReasoningContent = (content: string) => {
    const {messagesContainer} = getElements();
    const messageElement = messagesContainer.querySelector('.message.assistant.loading');
    if (!messageElement) {
      return;
    }
    if (!messageElement.querySelector('.reasoning-container')) {
      const template = this.#templates.initReasoningContainer();
      const clone = template.content.cloneNode(true) as DocumentFragment;
      const reasoningContainer = clone.firstElementChild;
      if (!reasoningContainer) {
        return;
      }
      messageElement.prepend(reasoningContainer);
    }
    const reasoningContent = messageElement.querySelector('.reasoning-content');
    if (!reasoningContent) {
      return;
    }
    requestAnimationFrame(async () => {
      const parsed = await parseMarkdown(content);
      reasoningContent.innerHTML = parsed;
    });
  };

  clear(): void {
    const elements = getElements();
    elements.messagesContainer.innerHTML = '';
  }

  setPaddingBottom() {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
    const {root, messagesContainer} = getElements();
    const container = root.querySelector('.app-container');
    if (!container) {
      return;
    }
    const MESSAGES_CONTAINER_PADDING_TOP = 12; // .messages-container 元素的 padding-top
    const BOTTOM_CONTAINER_CONTENT_HEIGHT = 142; // .bottom-container 元素的内容高度
    const BOTTOM_CONTAINER_MARGIN = 12; // .bottom-container 元素的 margin
    this.#observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const {height} = entry.contentRect;
        if (height === this.#height) {
          continue;
        }
        this.#height = height;
        if (this.#animationId !== null) {
          cancelAnimationFrame(this.#animationId);
        }
        this.#animationId = requestAnimationFrame(() => {
          messagesContainer.style.paddingBottom = `${height - MESSAGES_CONTAINER_PADDING_TOP - BOTTOM_CONTAINER_CONTENT_HEIGHT - BOTTOM_CONTAINER_MARGIN * 2}px`;
          this.#animationId = null;
        });
      }
    });
    this.#observer.observe(container);
  }
}

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

const messagesContainerRender = new MessagesContainerRender();

export {
  cacheElements,
  getElements,
  messagesContainerRender,
  userInputRender,
  buttonRender,
  alertRender,
};
