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

import Ajv, {type ValidateFunction, type AnySchema} from 'ajv';
import {mergeWith} from 'lodash-es';
import {messagesContainerRender} from '../view/dom';

let controller: AbortController | null = null;

function abort(): void {
  if (controller) {
    controller.abort();
    controller = null;
  }
}

interface StringParameter {
  type: 'string';
  description?: string;
  enum?: string[];
  pattern?: string;
  format?: string;
  default?: string;
  minLength?: number;
  maxLength?: number;
}

interface NumberParameter {
  type: 'number' | 'integer';
  description?: string;
  enum?: number[];
  minimum?: number;
  maximum?: number;
  default?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
}

interface BooleanParameter {
  type: 'boolean';
  description?: string;
  default?: boolean;
}

interface ArrayParameter {
  type: 'array';
  description?: string;
  items: Parameters;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  default?: unknown[];
}

interface ObjectParameter {
  type: 'object';
  description?: string;
  properties: Record<string, Parameters>;
  required?: string[];
  default?: Record<string, unknown>;
  additionalProperties?: boolean; // 是否允许额外字段
}

type Parameters =
  | StringParameter
  | NumberParameter
  | BooleanParameter
  | ArrayParameter
  | ObjectParameter;

type DefinitionType = 'function';

interface Definition {
  type: DefinitionType;
  function: {
    name: string;
    description: string;
    parameters: Extract<Parameters, {type: 'object'}>;
  };
}

type ParamType<T extends Parameters> =
  // 基本标量
  T extends {type: 'string'}
    ? string
    : T extends {type: 'number' | 'integer'}
      ? number
      : T extends {type: 'boolean'}
        ? boolean
        : // 数组：先拿到 items，再约束为 Parameters
          T extends {type: 'array'; items: infer I}
          ? I extends Parameters
            ? ParamType<I>[]
            : never
          : // 对象：拿到 properties / required，并做必要约束
            T extends {type: 'object'; properties: infer P; required?: infer R}
            ? RequiredKeys<
                P extends Record<string, Parameters> ? P : never,
                R extends readonly string[] | undefined ? R : undefined
              >
            : never;

// case 1: 有 required 数组
type RequiredKeysWithRequired<P extends Record<string, Parameters>, R extends string[]> = {
  [K in Extract<keyof P, R[number]>]: ParamType<P[K]>; // 必填
} & {
  [K in Exclude<keyof P, R[number]>]?: ParamType<P[K]>; // 可选
};

// case 2: 没有 required，全部可选
type RequiredKeysNoRequired<P extends Record<string, Parameters>> = {
  [K in keyof P]?: ParamType<P[K]>;
};

// 总入口
type RequiredKeys<
  P extends Record<string, Parameters>,
  R extends readonly string[] | undefined,
> = R extends string[] ? RequiredKeysWithRequired<P, R> : RequiredKeysNoRequired<P>;

type Args<T extends Definition> = ParamType<T['function']['parameters']>;

type Handler<T extends Definition> = (args: Args<T>) => string | Promise<string>;

type Tool<T extends Definition = Definition> = {
  def: T;
  handler: Handler<T>;
};

class ToolManager {
  protected tools: Record<string, Tool> = Object.create(null);

  protected ajv = new Ajv({
    allErrors: true,
    strict: false,
    allowUnionTypes: true,
  });

  private validatorCache: Record<string, ValidateFunction> = Object.create(null);

  register<T extends Definition>(def: T, handler: Handler<T>) {
    if (this.tools[def.function.name]) {
      throw new Error(`${def.function.name} 已存在`);
    }
    this.tools[def.function.name] = {def, handler};
  }

  getDefinition(name: string) {
    return this.tools[name]?.def;
  }

  getHandler(name: string) {
    return this.tools[name]?.handler;
  }

  remove(name: string) {
    delete this.tools[name];
    delete this.validatorCache[name];
  }

  get definitions(): Definition[] {
    return Object.values(this.tools).map((t) => t.def);
  }

  getDefinitions(names: string[]): Definition[] {
    return names.map((n) => this.getDefinition(n)).filter((d): d is Definition => Boolean(d));
  }

  private getValidator(name: string, schema: AnySchema): ValidateFunction {
    if (!this.validatorCache[name]) {
      this.validatorCache[name] = this.ajv.compile(schema);
    }
    return this.validatorCache[name];
  }

  validate(name: string, args: unknown) {
    const t = this.tools[name];
    if (!t) {
      throw new Error(`${name} 未注册`);
    }
    const schema = t.def.function.parameters; // 直接使用完整 schema，支持 additionalProperties 等
    const validate = this.getValidator(name, schema);
    if (!validate(args)) {
      const msg = this.ajv.errorsText(validate.errors, {separator: ', '});
      throw new Error(`参数验证失败: ${msg}`);
    }
    return true;
  }

  async call<T extends Definition>(name: string, args: Args<T>): Promise<string> {
    this.validate(name, args);
    const handler = this.getHandler(name);
    if (!handler) {
      throw new Error(`${name} 没有 handler`);
    }
    return handler(args);
  }
}

interface Config {
  model: string;
  url: string;
  systemMessageContent?: string;
  maxRounds?: number;
}

type ToolCall = {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
};

interface SimpleMessage {
  role: 'system' | 'user';
  content: string;
}

interface AssistantMessage {
  role: 'assistant';
  content: string;
  reasoning_content?: string;
  tool_calls?: ToolCall[] | null;
}

interface ToolMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
}

type Message = SimpleMessage | AssistantMessage | ToolMessage;

interface Params {
  tools?: string[];
  roundsLeft?: number;
}

interface Chunk {
  choices: Array<{
    delta: AssistantMessage;
  }>;
}

interface Result {
  choices: Array<{
    message: AssistantMessage;
  }>;
}

type StreamResult = AsyncGenerator<Chunk, AssistantMessage | StreamResult | undefined, void>;

class Agent extends ToolManager {
  model = '';
  url = '';
  messages: Message[] = [];
  maxRounds = 4;
  defaultParams: Params = {
    tools: [],
    roundsLeft: this.maxRounds,
  };

  constructor(config: Config) {
    super();
    const {model, url, systemMessageContent, maxRounds} = config;
    this.model = model;
    this.url = url;
    if (typeof maxRounds === 'number') {
      this.maxRounds = maxRounds;
    }
    if (systemMessageContent) {
      this.messages[0] = {
        role: 'system',
        content: systemMessageContent,
      };
    }
  }

  pushMessage(message: Message) {
    if (!message) {
      return;
    }
    this.messages.push(message);
  }

  pushMessages(messages: Message[]) {
    if (!messages.length) {
      return;
    }
    for (const element of messages) {
      this.pushMessage(element);
    }
  }

  merge<T extends object, S extends object>(
    target: T | null,
    source: S,
    fieldsToConcat: (keyof (T & S))[] = [],
  ): T & S {
    return mergeWith(
      {}, // 避免直接修改原对象
      target,
      source,
      (objValue: unknown, srcValue: unknown, key: keyof (T & S)) => {
        // 检查当前键是否需要拼接且都是字符串类型
        if (fieldsToConcat.includes(key)) {
          const objStr = typeof objValue === 'string' ? objValue : '';
          const srcStr = typeof srcValue === 'string' ? srcValue : '';
          return objStr + srcStr;
        }
        // 其他情况使用默认合并行为
        return undefined;
      },
    );
  }

  async invoke(params = this.defaultParams): Promise<AssistantMessage | undefined> {
    const {tools = [], roundsLeft = this.maxRounds} = params;
    abort();
    controller = new AbortController();
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.messages,
          tools: this.getDefinitions(tools),
          stream: false,
        }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        throw new DOMException('请求已被取消', 'AbortError');
      }

      const result = (await response.json()) as Result;

      const message = result?.choices?.[0]?.message;

      if (!message) {
        return;
      }

      /**
       * 兼容有的大模型返回的 role 是 null
       */
      if (message.role === null) {
        message.role = 'assistant';
      }

      const {content, role, tool_calls} = message;

      if (!tool_calls?.length) {
        return message;
      }

      if (content) {
        messagesContainerRender.pushLoadingMessage();
        requestAnimationFrame(() => messagesContainerRender.updateLoadingMessageContent(content));
        messagesContainerRender.finishLoadingMessage();
      }

      this.messages.push({
        content,
        role,
        tool_calls,
      });

      const promises = tool_calls.map(async (element) => {
        const {
          function: {name, arguments: args},
          id,
        } = element;
        const resp = await this.call(name, JSON.parse(args));
        this.messages.push({
          content: resp,
          role: 'tool',
          tool_call_id: id,
        });
      });
      await Promise.all(promises);

      // 剩余轮次 > 0 时继续回调
      if (roundsLeft - 1 > 0) {
        messagesContainerRender.pushLoadingMessage();
        return await this.invoke({tools: [], roundsLeft: roundsLeft - 1});
      }
    } finally {
      controller = null;
    }
  }

  async *invokeStream(params = this.defaultParams): StreamResult {
    const {tools = [], roundsLeft = this.maxRounds} = params;
    abort();
    controller = new AbortController();
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.messages,
          tools: this.getDefinitions(tools),
          stream: true,
        }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        throw new DOMException('请求已被取消', 'AbortError');
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let result: Chunk | null = null;

      const decoder = new TextDecoder();

      let buffer = '';

      while (true) {
        const {done, value} = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, {stream: true});
        const arr = chunk.split('\n\n').filter((item) => item.trim() !== '');
        for (const item of arr) {
          if (item === 'data: [DONE]') {
            break;
          }
          const jsonStr = item.trim().replace(/^data: /, '');
          try {
            const json = JSON.parse(buffer + jsonStr);
            result = this.merge(result, json, ['content', 'arguments']);
            yield json;
            buffer = '';
          } catch (error) {
            console.log('JSON 解析失败，等待下一个数据块继续拼接', {error, jsonStr});
            buffer += jsonStr;
          }
        }
      }

      const message = result?.choices?.[0]?.delta;

      if (!message) {
        return;
      }

      /**
       * 兼容有的大模型返回的 role 是 null
       */
      if (message.role === null) {
        message.role = 'assistant';
      }

      const {content, role, tool_calls} = message;

      if (!tool_calls?.length) {
        return message;
      }

      this.messages.push({
        content,
        role,
        tool_calls,
      });

      const promises = tool_calls.map(async (element) => {
        const {
          function: {name, arguments: args},
          id,
        } = element;
        const resp = await this.call(name, JSON.parse(args));
        this.messages.push({
          content: resp,
          role: 'tool',
          tool_call_id: id,
        });
      });
      await Promise.all(promises);

      // 剩余轮次 > 0 时继续回调
      if (roundsLeft - 1 > 0) {
        return this.invokeStream({tools: [], roundsLeft: roundsLeft - 1});
      }
    } finally {
      controller = null;
    }
  }
}

export {
  type Parameters,
  type Definition,
  type Args,
  type Handler,
  type Message,
  type AssistantMessage,
  type StreamResult,
  abort,
  ToolManager,
  Agent,
};
