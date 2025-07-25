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

import {alertRender, modelRender} from '../view/dom';

export interface ModelOption {
  model: string;
  url: string;
}

class ModelStore {
  #activeOption: ModelOption | null = null;
  #options: ModelOption[] = [];
  constructor() {
    const stored = localStorage.getItem('activeOption');
    if (!stored) {
      return;
    }
    const option = JSON.parse(stored) as ModelOption;
    this.#activeOption = option;
  }
  init(options: ModelOption[]) {
    this.#options = options;
    const option = this.#activeOption;
    if (option && this.#options.some((item) => item.model === option.model)) {
      return;
    }
    this.activeOption = this.#options[0];
  }
  get activeOption(): ModelOption {
    return this.#activeOption!;
  }
  set activeOption(option: ModelOption) {
    this.#activeOption = option;
    localStorage.setItem('activeOption', JSON.stringify(option));
  }
  get options(): ModelOption[] {
    return this.#options;
  }
  updateActiveOption(model: string): void {
    const option = this.#options.find((item) => item.model === model);
    if (option) {
      this.activeOption = option;
    } else {
      alertRender.show('未找到对应的选项，自动选择第一个');
      this.activeOption = this.#options[0];
      modelRender.select(this.activeOption);
    }
  }
}

export const modelStore = new ModelStore();
