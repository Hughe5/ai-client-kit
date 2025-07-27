import {parseRelativeDate} from '../utils/time';
import {Tool} from './tool-store';

export const defaultTools: Tool<any>[] = [
  {
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
];
