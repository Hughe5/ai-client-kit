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

// 只能从 src/index.ts 引入
import {AIChatPanel, Agent, type Message} from '../src';

const main = async () => {
  const container = document.getElementById('container');
  const panel = new AIChatPanel({container});
  const agent = new Agent({
    model: 'zai-org/GLM-4.5-FP8', // 大模型 ID
    url: 'http://localhost:8080/api/chat/completions', // 大模型 API 的代理接口
  });
  const init = () => {
    panel.pushMessage({role: 'assistant', content: 'hello'});
  };
  init();
  panel.on('send', async (message: Message) => {
    try {
      agent.pushMessage(message);
      panel.pushLoadingMessage();
      const generator = agent.invokeStream();
      let reasoningContentMarkdownStr = '';
      let contentMarkdownStr = '';
      while (true) {
        const {value, done} = await generator.next();
        if (done) {
          if (value) {
            agent.pushMessage(value);
          }
          break;
        }
        if (value.choices[0]?.delta.reasoning_content) {
          reasoningContentMarkdownStr += value.choices[0].delta.reasoning_content;
          panel.updateLoadingMessageReasoningContent(reasoningContentMarkdownStr);
        }
        if (value.choices[0]?.delta.content) {
          contentMarkdownStr += value.choices[0].delta.content;
          panel.updateLoadingMessageContent(contentMarkdownStr);
        }
      }
      panel.finishLoadingMessage();
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error, null, 2);

      console.error('操作失败:', msg);
    }
  });
  panel.on('create', () => {
    init();
  });
};

main().catch(console.error);
