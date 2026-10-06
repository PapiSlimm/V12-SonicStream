import { describe, it, expect, vi, beforeEach } from 'vitest';

// db.ts is mocked below; everything the LedgerService touches goes through this object.
vi.mock('../../../db.js', () => ({
  db: {
    run: vi.fn(),
    get: vi.fn(),
    all: vi.fn(),
  },
}));

import { db } from '../../../db.js';
import { LedgerService } from '../ledger.service.js';
import { LedgerTransactionType } from '../../../types.js';

const mockRun = db.run as ReturnType<typeof vi.fn>;
const mockGet = db.get as ReturnType<typeof vi.fn>;

describe('LedgerService.createBalancedTransaction', () => {
  beforeEach(() => {
    mockRun.mockReset();
    mockGet.mockReset();
    mockRun.mockResolvedValue({});
    mockGet.mockResolvedValue(undefined); // ensureWallet: wallet doesn't exist yet
  });

  it('rejects transactions whose entries do not sum to zero', async () => {
    // This is the core invariant of double-entry bookkeeping. If this check is ever
    // weakened or removed, money can be created or destroyed by a single call.
    await expect(
      LedgerService.createBalancedTransaction({
        tenantId: 'default',
        type: LedgerTransactionType.ROYALTY,
        description: 'test',
        entries: [
          { accountType: 'USER', userId: 'u1', amount: 100 },
          { accountType: 'ESCROW', amount: -50 }, // deliberately unbalanced
        ],
      })
    ).rejects.toThrow(/Ledger imbalance/);

    // Must fail before touching the database at all.
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('accepts a properly balanced transaction and commits it', async () => {
    const txId = await LedgerService.createBalancedTransaction({
      tenantId: 'default',
      type: LedgerTransactionType.ROYALTY,
      description: 'Revenue from stream',
      entries: [
        { accountType: 'USER', userId: 'u1', amount: 75 },
        { accountType: 'ESCROW', amount: -75 },
      ],
    });

    expect(txId).toMatch(/^tx_/);

    const calls = mockRun.mock.calls.map((c) => c[0]);
    expect(calls[0]).toBe('BEGIN TRANSACTION');
    expect(calls[calls.length - 1]).toBe('COMMIT');
    expect(calls).not.toContain('ROLLBACK');
  });

  it('tolerates floating point rounding noise within the 0.001 tolerance', async () => {
    // 0.1 + 0.2 - 0.3 !== 0 exactly in floating point; the tolerance exists on purpose.
    await expect(
      LedgerService.createBalancedTransaction({
        tenantId: 'default',
        type: LedgerTransactionType.ROYALTY,
        description: 'rounding',
        entries: [
          { accountType: 'USER', userId: 'u1', amount: 0.1 + 0.2 },
          { accountType: 'ESCROW', amount: -0.3 },
        ],
      })
    ).resolves.toMatch(/^tx_/);
  });

  it('rolls back and rethrows if a database write fails mid-transaction', async () => {
    mockRun
      .mockResolvedValueOnce({}) // BEGIN TRANSACTION
      .mockResolvedValueOnce({}) // INSERT ledger_transactions
      .mockRejectedValueOnce(new Error('db exploded')); // INSERT ledger_entries

    await expect(
      LedgerService.createBalancedTransaction({
        tenantId: 'default',
        type: LedgerTransactionType.ROYALTY,
        description: 'will fail',
        entries: [
          { accountType: 'USER', userId: 'u1', amount: 10 },
          { accountType: 'ESCROW', amount: -10 },
        ],
      })
    ).rejects.toThrow('db exploded');

    const calls = mockRun.mock.calls.map((c) => c[0]);
    expect(calls[calls.length - 1]).toBe('ROLLBACK');
  });
});

describe('LedgerService derived balance / dashboard queries', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('getBalance defaults to 0 instead of null/undefined when a user has no ledger entries', async () => {
    // SQL SUM() over zero rows returns NULL, not 0 - this guards against that surfacing
    // as "available: null" in an API response.
    mockGet.mockResolvedValueOnce(undefined);
    const balance = await LedgerService.getBalance('brand-new-user');
    expect(balance).toEqual({ available: 0, pending: 0 });
  });

  it('getRevenueDashboard computes netArtistEarnings as gross minus payouts', async () => {
    // db.get() applies snakeToCamel to raw SQL results internally (see server/db.ts),
    // so by the time it reaches LedgerService the keys are already camelCase.
    mockGet.mockResolvedValueOnce({
      grossVolume: 5000,
      platformRevenue: 750,
      payouts: 2000,
    });
    const dash = await LedgerService.getRevenueDashboard('tenant-1');
    expect(dash).toEqual({
      grossVolume: 5000,
      platformRevenue: 750,
      totalPayouts: 2000,
      netArtistEarnings: 3000,
    });
  });

  it('getRevenueDashboard defaults every field to 0 for a tenant with no activity', async () => {
    mockGet.mockResolvedValueOnce(undefined);
    const dash = await LedgerService.getRevenueDashboard('empty-tenant');
    expect(dash).toEqual({
      grossVolume: 0,
      platformRevenue: 0,
      totalPayouts: 0,
      netArtistEarnings: 0,
    });
  });
});
