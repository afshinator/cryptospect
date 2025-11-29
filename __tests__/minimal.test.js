// __tests__/minimal.test.js

describe('Minimal Test Suite', () => {
    it('should pass a basic assertion', () => {
      expect(1 + 1).toBe(2);
    });
  
    it('should verify strings match', () => {
      const greeting = 'Hello, World!';
      expect(greeting).toBe('Hello, World!');
    });
  
    it('should check array contents', () => {
      const numbers = [1, 2, 3];
      expect(numbers).toContain(2);
      expect(numbers.length).toBe(3);
    });
  });