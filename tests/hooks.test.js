import { describe, it, expect } from 'vitest';
import * as hooks from '../src/hooks/index.js';

describe('hooks/index.js', () => {
  it('should export hook functions', () => {
    expect(typeof hooks.useAsync).toBe('function');
    expect(typeof hooks.useFetch).toBe('function');
    expect(typeof hooks.useForm).toBe('function');
    expect(typeof hooks.useState).toBe('function');
    expect(typeof hooks.useStoreState).toBe('function');
    expect(typeof hooks.useEffect).toBe('function');
    expect(typeof hooks.useDebounce).toBe('function');
    expect(typeof hooks.useThrottle).toBe('function');
  });
});
