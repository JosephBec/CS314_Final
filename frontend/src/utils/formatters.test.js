import { formatDate, truncateText } from './formatters';

describe('Formatter Utilities', () => {
  describe('formatDate', () => {
    test('returns empty string for invalid date', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });
    
    test('formats valid date correctly', () => {
      // Create a specific date for testing
      const testDate = new Date(2023, 0, 15, 14, 30); // Jan 15, 2023, 2:30 PM
      
      // Format the date
      const formatted = formatDate(testDate);
      
      // We can't test the exact string since it depends on the locale and timezone
      // Instead, check that it contains the expected parts
      expect(formatted).toContain('2023');
      expect(formatted).toContain('1'); // Month (January is 1)
      expect(formatted).toContain('15'); // Day
    });
  });

  describe('truncateText', () => {
    test('returns empty string for null or undefined input', () => {
      expect(truncateText(null, 10)).toBe('');
      expect(truncateText(undefined, 10)).toBe('');
    });
    
    test('returns original text if shorter than maxLength', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe(shortText);
    });
    
    test('truncates text longer than maxLength', () => {
      const longText = 'This is a very long text that should be truncated';
      const maxLength = 20;
      const expected = longText.substring(0, maxLength) + '...';
      expect(truncateText(longText, maxLength)).toBe(expected);
    });
    
    test('handles edge cases correctly', () => {
      expect(truncateText('', 10)).toBe('');
      expect(truncateText('Exactly 10', 10)).toBe('Exactly 10');
      expect(truncateText('Exactly 10!', 10)).toBe('Exactly 10...');
    });
  });
});
