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

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  model?: string;
  isLoading?: boolean;
  tool_call_id?: string;
}

export interface Session {
  time: number;
  messages: Message[];
}

class SessionStore {
  #sessions: Session[];
  #activeTime: number | null;
  #systemMessageContent = '';

  constructor() {
    this.#sessions = this.#loadSessions();
    this.#ensureSessionExists();
    this.#activeTime = this.#loadActiveTime();
  }

  #loadSessions(): Session[] {
    const sessions = localStorage.getItem('sessions');
    return sessions ? (JSON.parse(sessions) as Session[]) : [];
  }

  #loadActiveTime(): number | null {
    const time = localStorage.getItem('activeTime');
    return time ? Number(time) : null;
  }

  #ensureSessionExists(): void {
    if (this.#sessions.length === 0) {
      this.createSession();
    }
  }

  #saveSessions(): void {
    localStorage.setItem('sessions', JSON.stringify(this.#sessions));
  }

  #saveActiveTime(): void {
    if (this.#activeTime) {
      localStorage.setItem('activeTime', String(this.#activeTime));
    } else {
      localStorage.removeItem('activeTime');
    }
  }

  get sessions(): Session[] {
    return this.#sessions;
  }

  get activeTime(): number | null {
    return this.#activeTime;
  }

  updateSystemMessageContent(messageContent: string): void {
    this.#systemMessageContent = messageContent;
  }

  getSessionByTime(time: number): Session {
    return this.#sessions.find((session) => session.time === time)!;
  }

  get activeSession(): Session {
    const session = this.#activeTime
      ? this.getSessionByTime(this.#activeTime)
      : this.#sessions[0];

    if (session.messages.length === 0 && this.#systemMessageContent) {
      session.messages.unshift({
        role: 'system',
        content: this.#systemMessageContent,
      });
    }
    return session;
  }

  createSession(): void {
    const time = Date.now();
    const session: Session = {
      time,
      messages: [], // 系统消息动态生成
    };

    this.#sessions.unshift(session);
    this.#saveSessions();

    this.#activeTime = time;
    this.#saveActiveTime();
  }

  addMessage(message: Message): void {
    this.activeSession.messages.push(message);
    this.#saveSessions();
  }

  switchSession(time: number): Session {
    const session = this.getSessionByTime(time);
    this.#activeTime = time;
    this.#saveActiveTime();
    return session;
  }

  deleteSession(time: number): void {
    const index = this.#sessions.findIndex((session) => session.time === time);
    if (index === -1) return;

    this.#sessions.splice(index, 1);
    this.#saveSessions();

    if (this.#activeTime === time) {
      this.#activeTime = null;
      this.#saveActiveTime();
    }

    // 确保删除后至少还有一个会话
    this.#ensureSessionExists();
  }

  getSessionTitle(session: Session): string {
    const message = session.messages.find((message) => message.role === 'user');
    return message ? message.content : '无内容';
  }
}

export const sessionStore = new SessionStore();
