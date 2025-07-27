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

interface Definition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {type: string; description: string}>;
      required: string[];
    };
  };
}

type Implementation<TParams> = (params: TParams) => string | Promise<string>;

export interface Tool<TParams> {
  definition: Definition;
  implementation: Implementation<TParams>;
  name?: string;
}

class ToolStore {
  tools: Tool<any>[] = [];
  register(tools: Tool<any>[]): void {
    this.tools = tools.map((item) => ({
      ...item,
      name: item.definition.function.name,
    }));
  }

  get definitions(): Definition[] {
    return this.tools.map((item) => item.definition);
  }

  getImplementationByName(name: string): Implementation<any> | undefined {
    return this.tools.find((item) => item.name === name)?.implementation;
  }
}

export const toolStore = new ToolStore();
