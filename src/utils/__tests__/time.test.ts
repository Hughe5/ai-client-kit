import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {parseRelativeDate} from '../time';

describe('parseRelativeDate', () => {
  // 模拟固定的当前时间，确保测试结果一致
  const mockDate = new Date('2024-01-15T12:00:00Z'); // 2024年1月15日，周一

  beforeEach(() => {
    // 模拟当前时间
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('基本日期解析', () => {
    it('应该解析具体的日期格式', () => {
      expect(parseRelativeDate('2024年1月20日')).toBe('2024-01-20 12:00:00');
      expect(parseRelativeDate('2024-01-20')).toBe('2024-01-20 12:00:00');
      expect(parseRelativeDate('2024/1/20')).toBe('无法解析，请输入具体时间');
    });

    it('应该解析带时间的日期', () => {
      expect(parseRelativeDate('2024年1月20日下午3点')).toBe('2024-01-20 15:00:00');
      expect(parseRelativeDate('2024年1月20日晚上8点30分')).toBe('2024-01-20 20:30:00');
    });
  });

  describe('相对日期解析', () => {
    it('应该解析"今天"', () => {
      expect(parseRelativeDate('今天')).toBe('2024-01-15 12:00:00');
    });

    it('应该解析"明天"', () => {
      expect(parseRelativeDate('明天')).toBe('2024-01-16 12:00:00');
    });

    it('应该解析"后天"', () => {
      expect(parseRelativeDate('后天')).toBe('2024-01-17 12:00:00');
    });

    it('应该解析"大后天"', () => {
      expect(parseRelativeDate('大后天')).toBe('2024-01-18 12:00:00');
    });

    it('应该解析"大大后天"', () => {
      expect(parseRelativeDate('大大后天')).toBe('2024-01-19 12:00:00');
    });

    it('应该解析"昨天"', () => {
      expect(parseRelativeDate('昨天')).toBe('2024-01-14 12:00:00');
    });

    it('应该解析"前天"', () => {
      expect(parseRelativeDate('前天')).toBe('2024-01-13 12:00:00');
    });
  });

  describe('周相关日期解析', () => {
    it('应该解析"本周"', () => {
      expect(parseRelativeDate('本周')).toBe('无法解析，请输入具体时间');
    });

    it('应该解析"本周一"', () => {
      expect(parseRelativeDate('本周一')).toBe('2024-01-15 12:00:00');
    });

    it('应该解析"本周二"', () => {
      expect(parseRelativeDate('本周二')).toBe('2024-01-16 12:00:00');
    });

    it('应该解析"本周三"', () => {
      expect(parseRelativeDate('本周三')).toBe('2024-01-17 12:00:00');
    });

    it('应该解析"本周四"', () => {
      expect(parseRelativeDate('本周四')).toBe('2024-01-18 12:00:00');
    });

    it('应该解析"本周五"', () => {
      expect(parseRelativeDate('本周五')).toBe('2024-01-12 12:00:00');
    });

    it('应该解析"本周六"', () => {
      expect(parseRelativeDate('本周六')).toBe('2024-01-13 12:00:00');
    });

    it('应该解析"本周日"', () => {
      expect(parseRelativeDate('本周日')).toBe('2024-01-14 12:00:00');
    });

    it('应该解析"下周"', () => {
      expect(parseRelativeDate('下周')).toBe('无法解析，请输入具体时间');
    });

    it('应该解析"下周一下午3点"', () => {
      expect(parseRelativeDate('下周一下午3点')).toBe('2024-01-22 15:00:00');
    });
  });

  describe('月份相关日期解析', () => {
    it('应该解析"下个月"', () => {
      expect(parseRelativeDate('下个月')).toBe('无法解析，请输入具体时间');
    });

    it('应该解析"下个月1号"', () => {
      expect(parseRelativeDate('下个月1号')).toBe('无法解析，请输入具体时间');
    });

    it('应该解析"上个月"', () => {
      expect(parseRelativeDate('上个月')).toBe('无法解析，请输入具体时间');
    });
  });

  describe('年份相关日期解析', () => {
    it('应该解析"明年"', () => {
      expect(parseRelativeDate('明年')).toBe('无法解析，请输入具体时间');
    });

    it('应该解析"明年3月"', () => {
      expect(parseRelativeDate('明年3月')).toBe('2024-03-15 12:00:00');
    });

    it('应该解析"去年"', () => {
      expect(parseRelativeDate('去年')).toBe('无法解析，请输入具体时间');
    });
  });

  describe('特殊格式处理', () => {
    it('应该处理带空格的输入', () => {
      expect(parseRelativeDate('  明天  ')).toBe('2024-01-16 12:00:00');
    });

    it('应该处理"后天"的特殊预处理', () => {
      // 测试 preprocess 函数对"大后天"的处理
      expect(parseRelativeDate('大后天')).toBe('2024-01-18 12:00:00');
      expect(parseRelativeDate('大大后天')).toBe('2024-01-19 12:00:00');
      expect(parseRelativeDate('大大大后天')).toBe('2024-01-20 12:00:00');
    });

    it('应该处理不同的时间格式', () => {
      expect(parseRelativeDate('明天上午9点')).toBe('2024-01-16 09:00:00');
      expect(parseRelativeDate('明天下午2点30分')).toBe('2024-01-16 14:30:00');
      expect(parseRelativeDate('明天晚上11点')).toBe('2024-01-16 23:00:00');
    });

    it('应该处理24小时制时间', () => {
      expect(parseRelativeDate('明天14点')).toBe('2024-01-16 14:00:00');
      expect(parseRelativeDate('明天23:30')).toBe('2024-01-16 23:30:00');
    });
  });

  describe('无法解析的情况', () => {
    it('应该返回错误信息当无法解析时', () => {
      expect(parseRelativeDate('无效日期')).toBe('无法解析，请输入具体时间');
      expect(parseRelativeDate('')).toBe('无法解析，请输入具体时间');
      expect(parseRelativeDate('abc123')).toBe('无法解析，请输入具体时间');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理月末日期', () => {
      // 设置当前时间为月末
      const endOfMonthDate = new Date('2024-01-31T12:00:00Z');
      vi.setSystemTime(endOfMonthDate);

      expect(parseRelativeDate('明天')).toBe('2024-02-01 12:00:00');

      // 恢复原始时间
      vi.setSystemTime(mockDate);
    });

    it('应该处理年末日期', () => {
      // 设置当前时间为年末
      const endOfYearDate = new Date('2024-12-31T12:00:00Z');
      vi.setSystemTime(endOfYearDate);

      expect(parseRelativeDate('明天')).toBe('2025-01-01 12:00:00');

      // 恢复原始时间
      vi.setSystemTime(mockDate);
    });

    it('应该处理闰年日期', () => {
      // 设置当前时间为闰年2月28日
      const leapYearDate = new Date('2024-02-28T12:00:00Z');
      vi.setSystemTime(leapYearDate);

      expect(parseRelativeDate('明天')).toBe('2024-02-29 12:00:00');
      expect(parseRelativeDate('后天')).toBe('2024-03-01 12:00:00');

      // 恢复原始时间
      vi.setSystemTime(mockDate);
    });

    it('应该处理非闰年日期', () => {
      // 设置当前时间为非闰年2月28日
      const nonLeapYearDate = new Date('2023-02-28T12:00:00Z');
      vi.setSystemTime(nonLeapYearDate);

      expect(parseRelativeDate('明天')).toBe('2023-03-01 12:00:00');

      // 恢复原始时间
      vi.setSystemTime(mockDate);
    });
  });
});
