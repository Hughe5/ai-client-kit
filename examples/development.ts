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

import {AIChatPanel, Agent} from '../src/index.ts';
import type {Message} from '../src/utils/agent.ts';

const main = async () => {
  const container = document.getElementById('container');
  const panel = new AIChatPanel({container});
  const agent = new Agent({
    model: 'ernie-4.5-turbo-32k', // 模型 ID
    url: 'http://localhost:8080/api/chat/completions', // 大模型 API 的代理接口
  });
  panel.pushMessage({role: 'assistant', content: 'hello'});
  panel.on('send', async (message: Message) => {
    agent.pushMessage(message);
    const res = await agent.invoke();
    panel.pushMessage(res);
  });
};

main().catch(console.error);