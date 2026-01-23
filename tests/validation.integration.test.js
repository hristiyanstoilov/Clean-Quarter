import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as validation from '../src/services/validation.js';

describe('validation.js integration', () => {
  beforeEach(() => {
    // Reset any custom rules/schemas if needed
  });

  it('validates a field with required rule', () => {
    const result = validation.validateField('', ['required']);
    expect(result).toBe('Полето е задължително');
    const ok = validation.validateField('test', ['required']);
    expect(ok).toBe(true);
  });

  it('validates a form with schema', () => {
    const schema = {
      email: ['required', 'email'],
      password: ['required', { minLength: 6 }],
    };
    const data = { email: '', password: '123' };
    const result = validation.validateForm(data, schema);
    expect(result.email).toBe('Полето е задължително');
    expect(result.password).toBe('Минимална дължина е 6');
  });

  it('adds and uses a custom rule', () => {
    validation.addRule('alwaysFail', (v) => 'fail');
    const result = validation.validateField('anything', ['alwaysFail']);
    expect(result).toBe('fail');
  });

  it('adds and uses a custom schema', () => {
    validation.addSchema('testSchema', { foo: ['required'] });
    const result = validation.validateWithSchema('testSchema', { foo: '' });
    expect(result.foo).toBe('Полето е задължително');
  });
});
