// A simple test file to verify Jest is working

describe('Basic Jest functionality', () => {
  test('true is truthy', () => {
    expect(true).toBe(true);
  });

  test('false is falsy', () => {
    expect(false).toBe(false);
  });

  test('1 + 1 equals 2', () => {
    expect(1 + 1).toBe(2);
  });
});
