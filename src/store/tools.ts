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

import {parseRelativeDate} from '../utils/time';
import {Tool} from './tool-store';

export const tools: Record<string, Tool<any>> = {
  parse_relative_date: {
    definition: {
      type: 'function',
      function: {
        name: 'parse_relative_date',
        description: '把相对时间转成绝对时间',
        parameters: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: '相对时间',
            },
          },
          required: ['input'],
        },
      },
    },
    implementation: (params: {input: string}) => {
      return parseRelativeDate(params.input);
    },
  },
};
