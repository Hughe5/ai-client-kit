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

import {userInputRender, messagesContainerRender} from '../view/dom';
import {sessionStore, Message} from '../store/session-store';
import {modelStore} from '../store/model-store';
import {toolStore} from '../store/tool-store';

interface ToolCall {
  index: number;
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface Choice {
  delta: {
    content?: string;
    tool_calls?: ToolCall[];
  };
}

interface Chunk {
  choices: Choice[];
}

let abortController: AbortController | null = null;

export function handleCancel(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

export async function chat(): Promise<void> {
  let assistantMessage: Message & {tool_calls?: ToolCall[]} = {
    role: 'assistant',
    content: '',
    model: modelStore.activeOption.model,
  };

  try {
    userInputRender.clear();

    messagesContainerRender.addLoading();

    // 创建新的 AbortController
    abortController = new AbortController();

    const response = await fetch(modelStore.activeOption.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelStore.activeOption.model,
        messages: sessionStore.activeSession.messages,
        stream: true,
        tools: toolStore.definitions,
      }),
      signal: abortController.signal,
    });

    if (!response.body) {
      throw new Error('response.body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, {stream: true});
      buffer += chunk;

      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (part === ': OPENROUTER PROCESSING') {
          continue;
        }
        if (part === 'data: [DONE]') {
          console.log('Stream done.');

          if (assistantMessage.content) {
            messagesContainerRender.removeLoading();
          }
          if (assistantMessage.content || assistantMessage.tool_calls?.length) {
            sessionStore.addMessage(assistantMessage);
          }

          if (assistantMessage.tool_calls?.length) {
            messagesContainerRender.addLoading();
            const promises = assistantMessage.tool_calls.map(async (item) => {
              const {
                function: {name, arguments: args},
                id,
              } = item;
              const params = JSON.parse(args);
              const implementation = toolStore.getImplementationByName(name);
              if (implementation) {
                const result = await implementation(params);
                const toolMessage: Message = {
                  role: 'tool',
                  content: result,
                  tool_call_id: id,
                };
                sessionStore.addMessage(toolMessage);
              }
            });
            await Promise.all(promises);
            await chat();
          }

          return;
        }

        const jsonStr = part.replace(/^data: /, '');
        try {
          const json: Chunk = JSON.parse(jsonStr);
          const content = json.choices[0].delta.content;
          const tool_calls = json.choices[0].delta.tool_calls;
          if (content) {
            assistantMessage.content += content;
            messagesContainerRender.replaceLoading(assistantMessage);
          }
          if (tool_calls?.length) {
            tool_calls.forEach((item) => {
              const {index, function: {arguments: args = ''} = {}} = item;
              if (!assistantMessage.tool_calls) {
                assistantMessage.tool_calls = [];
              }
              if (assistantMessage.tool_calls[index]) {
                assistantMessage.tool_calls[index].function.arguments += args;
              } else {
                assistantMessage.tool_calls[index] = item;
              }
            });
          }
        } catch (err) {
          console.error('JSON parse error', {err, jsonStr});
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('请求已取消');
      if (assistantMessage.content) {
        messagesContainerRender.removeLoading();
      }
      if (assistantMessage.content || assistantMessage.tool_calls?.length) {
        sessionStore.addMessage(assistantMessage);
      }
    } else {
      console.error('请求出错:', error);
    }
  } finally {
    // 统一清除 AbortController
    abortController = null;
  }
}
