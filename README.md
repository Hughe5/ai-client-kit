# AI Client Kit

`AI Client Kit` 是一套面向前端的 AI 集成套件，帮助开发者在 Web 应用中快速接入多模型兼容的 AI 功能。

## Features

- 多模型接入与切换（兼容文心、豆包、Google Gemini 等）
- 简洁易用的 AI 聊天面板
- 灵活配置系统消息
- 本地存储和管理聊天记录
- 接入自定义工具函数（Function Calling，将 AI 聊天与业务逻辑相结合）
- 提供一些常用的工具函数（如解析相对时间），开发者可按需使用
- 纯原生实现，技术栈无关，支持任意前端框架（如 React、Vue）或纯 HTML 页面

## 安装

使用 npm 或 yarn：

```bash
npm install ai-client-kit
# 或
yarn add ai-client-kit
```

## 开发

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
# 运行所有测试
npm run test:run

# 监听模式运行测试（开发时推荐）
npm run test
```

### 构建

```bash
npm run build
```

## 快速开始

### 初始化 AI 聊天面板

使用 `initAIChatPanel` 初始化并渲染 Web 端的 AI 聊天面板。

### 示例

```typescript
import {initAIChatPanel} from 'ai-client-kit';

initAIChatPanel({
  modelOptions: [
    {
      model: 'ernie-4.5-turbo-128k', // 模型 ID
      url: 'https://your-backend.com/api/chat/completions', // 你的代理接口地址
    },
  ],
  container: document.getElementById('container'), // 聊天面板挂载位置
  systemMessageContent: '你是一个智能助手，可以协助用户完成多个任务，例如提交差旅申请。',
});
```

### 参数说明

| Parameter              | Type                                   | Required | Description                                                   |
| ---------------------- | -------------------------------------- | :------: | ------------------------------------------------------------- |
| `modelOptions`         | `Array<{model: string; url: string;}>` |    Y     | 配置多模型，传入模型 ID + 代理接口地址                        |
| `container`            | `HTMLElement`                          |    Y     | 聊天面板挂载的 DOM 容器                                       |
| `systemMessageContent` | `string`                               |    N     | system message 为 AI 设定角色、行为模式或提供额外的上下文信息 |

### 注意事项

- `initAIChatPanel` 在 DOM 准备就绪后调用，确保 `container` 元素已存在。
- `modelOptions` 数组允许配置多个大模型，默认使用第一个。请确保 `model` 是有效、可用的。
- `url` 是大模型文本生成 API 的代理接口，使用后端代理避免直接在 Web 应用中暴露大模型的 API Key 或 Token 等敏感信息。
- `systemMessageContent` 建议保持简洁明了，过长或复杂的系统消息可能会影响大模型的理解和性能。

## 高级用法

### Function Calling（工具函数调用）

- `AI Client Kit` 支持大模型的 Function Calling（工具函数调用）能力。
- 请确保 `initAIChatPanel` 的 `modelOptions` 参数里每个模型都是支持 Function Calling 的。
- 大模型在理解用户意图后，自动调用您注册的自定义工具函数，以执行特定任务或获取外部数据。
- `AI Client Kit` 也为您提供了一些常用的工具函数，节省您的开发时间，可按需使用。
- 通过 `registerTools` 函数向 `AI Client Kit` 注册工具函数。

### 内置工具函数

#### 解析相对时间（tools.parse_relative_date）

**功能说明：**

- 将相对时间转为绝对时间
- 支持中文相对时间，如"明天"、"后天"、"大后天"、"本周三"、"下周一下午 3 点"等
- 返回格式化的时间字符串（YYYY-MM-DD HH:mm:ss）

**使用示例：**

- 用户输入："明天下午 3 点开会"
- 大模型调用工具函数解析后返回："2024-01-16 15:00:00"

### 示例

```typescript
import {tools, registerTools} from 'ai-client-kit';

registerTools([
  tools.parse_relative_date, // 可选，根据您的需求判断是否要使用该工具函数
  {
    definition: {
      type: 'function',
      function: {
        name: 'submit_travel_request',
        description: '提交差旅申请，包含出发城市、到达城市。',
        parameters: {
          type: 'object',
          properties: {
            departure_city: {
              type: 'string',
              description: '出发城市',
            },
            arrival_city: {
              type: 'string',
              description: '到达城市',
            },
          },
          required: ['departure_city', 'arrival_city'],
        },
      },
    },
    implementation: async (params) => {
      // 自研工具函数的逻辑，例如
      try {
        // 发起请求（替换为您自己的接口地址和逻辑）
        const response = await fetch('https://api.yourdomain.com/travel/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        const result = await response.json();

        if (result.success) {
          return `提交成功，单据 ID：${result.id}`;
        } else {
          return `提交失败：${result.message || '未知错误'}`;
        }
      } catch (error) {
        // 捕获网络或代码错误
        return `提交异常：${error.message || error}`;
      }
    },
  },
]);
```

### 函数签名

```typescript
function registerTools(
  tools: Array<{
    definition: {
      type: 'function';
      function: {
        name: string;
        description: string;
        parameters: object; // OpenAPI Schema Format
      };
    };
    implementation: (params: Record<string, any>) => string | Promise<string>;
  }>,
): void;
```

### 参数说明

- `tools`: **（必填）** 一个数组，每项代表一个要注册的工具函数。
  - `definition`: **（必填）** 工具函数的定义，向大模型描述工具函数的功能和参数。
    - `type`: 固定为 `'function'`。

    - `function`: 工具函数的具体描述。
      - `name`: **（必填）** 字符串类型，工具函数的唯一名称。大模型会根据该名称调用对应工具函数。

      - `description`: **（必填）** 字符串类型，简要描述工具函数的功能，帮助大模型判断何时调用该工具函数。

      - `parameters`: **（必填）** 对象类型，遵循 [OpenAPI Schema Format](https://swagger.io/docs/specification/data-models/data-types/)，用于定义工具函数所需的参数。例如：

        ```json
        {
          "type": "object",
          "properties": {
            "departure_city": {
              "type": "string",
              "description": "出发城市"
            },
            "arrival_city": {
              "type": "string",
              "description": "到达城市"
            }
          },
          "required": ["departure_city", "arrival_city"]
        }
        ```

        - `type`: 参数的类型（例如 `'object'`）。
        - `properties`: 参数的属性，每个属性定义一个参数的名称、类型和描述。
        - `required`: 数组，列出所有必填参数的名称。

  - `implementation`: **（必填）** 工具函数的实现，支持同步或异步函数。
    - 接收一个 `params` 对象作为参数，包含大模型解析后传入的参数值。

    - **该函数必须返回一个字符串，表示工具函数执行的结果。**

### 工作原理

1.  用户输入 → 大模型分析意图
2.  大模型根据工具函数的 `description` → 判断是否调用某个工具函数
3.  大模型生成工具函数调用 JSON（包含 `name` 和 `params`）
4.  `AI Client Kit` 调用 `implementation`
5.  `implementation` 函数执行具体逻辑（例如，调用后端 API、查询数据库等）
6.  返回结果字符串给大模型 → 大模型根据该字符串继续生成回复

### 注意事项

- 工具函数的 `description` 越清晰准确，大模型就越能正确地识别和调用。
- `parameters` 的定义（特别是 `description`）对于大模型理解参数的含义至关重要。
- `implementation` 函数返回的字符串是大模型了解工具函数执行情况的唯一途径。如果函数执行失败，也应该返回一个描述失败原因的字符串。
- `implementation` 函数通常是异步的，因为它可能涉及网络请求或其他耗时操作。
- 在 `implementation` 中，务必处理可能出现的错误（例如网络请求失败），并返回相应的错误信息，以便大模型可以向用户提供有用的反馈。

## License

- [Apache 2.0](./LICENSE)
