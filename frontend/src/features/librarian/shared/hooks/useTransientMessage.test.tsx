import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTransientMessage } from './useTransientMessage';

describe('useTransientMessage', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('automatically clears a message after four seconds', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTransientMessage());

    act(() => result.current.setMessage('Salvo'));
    expect(result.current.message).toBe('Salvo');

    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.message).toBeNull();
  });
});
