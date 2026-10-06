import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../db.js', () => ({
  get: vi.fn(),
}));

vi.mock('../ledger.service.js', () => ({
  LedgerService: {
    createBalancedTransaction: vi.fn().mockResolvedValue('tx_mock'),
  },
}));

import { get } from '../../../db.js';
import { LedgerService } from '../ledger.service.js';
import { safeBalanceUpdate } from '../balance.service.js';

const mockGet = get as ReturnType<typeof vi.fn>;
const mockCreateTx = LedgerService.createBalancedTransaction as ReturnType<typeof vi.fn>;

describe('safeBalanceUpdate', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockCreateTx.mockClear();
    mockCreateTx.mockResolvedValue('tx_mock');
  });

  it('pays out immediately for a Pro user regardless of content age', async () => {
    mockGet.mockResolvedValueOnce({ isPro: 1 }); // users lookup

    const result = await safeBalanceUpdate('user-1', 42, 'stream_royalty');

    expect(result).toBe(true);
    expect(mockCreateTx).toHaveBeenCalledTimes(1);
    // Only one DB read (user lookup) - Pro users skip the content-age check entirely.
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('blocks payout for a non-Pro user with less than 60 days of approved content', async () => {
    mockGet
      .mockResolvedValueOnce({ isPro: 0 }) // users lookup
      .mockResolvedValueOnce({ days: 12 }); // content proof

    const result = await safeBalanceUpdate('user-2', 42, 'stream_royalty');

    expect(result).toBe(false);
    expect(mockCreateTx).not.toHaveBeenCalled();
  });

  it('allows payout for a non-Pro user once past the 60-day content threshold', async () => {
    mockGet
      .mockResolvedValueOnce({ isPro: 0 })
      .mockResolvedValueOnce({ days: 61 });

    const result = await safeBalanceUpdate('user-3', 42, 'stream_royalty');

    expect(result).toBe(true);
    expect(mockCreateTx).toHaveBeenCalledTimes(1);
  });

  it('blocks payout for a non-Pro user with no approved content at all (days is null)', async () => {
    // SQL MIN()/julianday() math over zero matching rows yields NULL, not 0.
    mockGet
      .mockResolvedValueOnce({ isPro: 0 })
      .mockResolvedValueOnce({ days: null });

    const result = await safeBalanceUpdate('user-4', 42, 'stream_royalty');

    expect(result).toBe(false);
    expect(mockCreateTx).not.toHaveBeenCalled();
  });

  it('creates a balanced USER/ESCROW pair for the requested amount', async () => {
    mockGet.mockResolvedValueOnce({ isPro: 1 });

    await safeBalanceUpdate('user-5', 30, 'merch_sale', 'tenant-9');

    expect(mockCreateTx).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-9',
        entries: [
          { accountType: 'USER', userId: 'user-5', amount: 30 },
          { accountType: 'ESCROW', amount: -30 },
        ],
      })
    );
  });

  it('fails closed (returns false, does not throw) if the database errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('connection lost'));

    const result = await safeBalanceUpdate('user-6', 10, 'stream_royalty');

    expect(result).toBe(false);
  });
});
