import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../db.js', () => ({
  get: vi.fn(),
  run: vi.fn(),
}));

vi.mock('../balance.service.js', () => ({
  safeBalanceUpdate: vi.fn().mockResolvedValue(true),
}));

import { get, run } from '../../../db.js';
import { safeBalanceUpdate } from '../balance.service.js';
import { processRoyaltiesWithRecoupment } from '../recoupment.service.js';

const mockGet = get as ReturnType<typeof vi.fn>;
const mockRun = run as ReturnType<typeof vi.fn>;
const mockSafeBalanceUpdate = safeBalanceUpdate as ReturnType<typeof vi.fn>;

describe('processRoyaltiesWithRecoupment', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockRun.mockReset();
    mockSafeBalanceUpdate.mockClear();
    mockRun.mockResolvedValue({});
  });

  it('pays the full royalty to the artist when there is no outstanding advance', async () => {
    mockGet.mockResolvedValueOnce(undefined); // no active advance

    await processRoyaltiesWithRecoupment(123, 100, 'spotify_stream');

    expect(mockRun).not.toHaveBeenCalled(); // nothing to recoup, no transactions logged
    expect(mockSafeBalanceUpdate).toHaveBeenCalledWith('123', 100, 'spotify_stream');
  });

  it('recoups the correct share and pays the remainder to the artist when an advance is active', async () => {
    mockGet.mockResolvedValueOnce({
      id: 7,
      recoupment_rate: 50, // 50%
      balance_remaining: 1000,
    });

    await processRoyaltiesWithRecoupment(123, 200, 'spotify_stream');

    // 50% of 200 = 100 recouped, artist gets the remaining 100
    expect(mockSafeBalanceUpdate).toHaveBeenCalledWith('123', 100, 'spotify_stream_post_recoup');
  });

  it('never recoups more than the advance balance remaining, even if the rate would imply more', async () => {
    mockGet.mockResolvedValueOnce({
      id: 8,
      recoupment_rate: 100, // 100% recoupment rate
      balance_remaining: 30, // but only $30 left owed
    });

    await processRoyaltiesWithRecoupment(456, 200, 'apple_music_stream');

    // recoupAmount = min(200 * 1.0, 30) = 30; artist keeps 170
    expect(mockSafeBalanceUpdate).toHaveBeenCalledWith('456', 170, 'apple_music_stream_post_recoup');
  });

  it('always passes the artist share to safeBalanceUpdate as a string userId', async () => {
    // Regression test: this previously threw a TS type error and, at runtime, would have
    // passed a raw number where a string was expected everywhere downstream in the ledger.
    mockGet.mockResolvedValueOnce(undefined);

    await processRoyaltiesWithRecoupment(999, 50, 'source');

    const [userIdArg] = mockSafeBalanceUpdate.mock.calls[0];
    expect(typeof userIdArg).toBe('string');
    expect(userIdArg).toBe('999');
  });
});
