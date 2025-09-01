# AI Client Kit

`AI Client Kit` 是一套面向前端的 AI 集成套件，帮助开发者在 Web 应用中快速接入多模型兼容的 AI 功能。

## Features

- 多模型接入（兼容文心、豆包、Google Gemini 等）
- 简洁易用的 AI 聊天面板
- 灵活配置系统消息
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

实例化 `AIChatPanel` 把 Web 端的 AI 聊天面板挂载到指定容器。

### 示例

```typescript
import {AIChatPanel} from 'ai-client-kit';

const container = document.getElementById('container');
const panel = new AIChatPanel({container});
```

### 参数说明

| Parameter   | Type                    | Required | Description |
| ----------- | ----------------------- | :------: | ----------- |
| `container` | `HTMLElement \| null`   | Y        | 聊天面板挂载的 DOM 容器 |

### 注意事项

- 在 DOM 准备就绪后实例化 `AIChatPanel`，确保 `container` 元素已存在。

## 内置工具函数

### 解析相对时间（tools.parse_relative_date）

**功能说明：**

- 将相对时间转为绝对时间
- 支持中文相对时间，如"明天"、"后天"、"大后天"、"本周三"、"下周一下午 3 点"等
- 返回格式化的时间字符串（YYYY-MM-DD HH:mm:ss）

**使用示例：**

- 用户输入："明天下午 3 点开会"
- 大模型调用工具函数解析后返回："2024-01-16 15:00:00"

## License

- [Apache 2.0](./LICENSE)
