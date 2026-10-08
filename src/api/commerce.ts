import { apiFetch, json } from './apiFetch';
import { Product, Sale } from '../types';

/**
 * 2026-10-08: Firestore removed. Products and sales now live on the platform's
 * own shelf (the same tables the BST agents stock), served by /api/products
 * and /api/sales — one shared DB, no external service in the path.
 */
export const commerceApi = {
  products: {
    getAll: () => apiFetch<Product[]>('/api/products'),
    getById: async (id: string): Promise<Product | null> => {
      try {
        return await apiFetch<Product>(`/api/products/${id}`);
      } catch {
        return null;
      }
    },
    getArtistProducts: (artistId: string) =>
      apiFetch<Product[]>(`/api/products/artist/${encodeURIComponent(artistId)}`),
    create: (data: Partial<Product>) =>
      apiFetch<{ id: string; success: boolean }>('/api/products', {
        method: 'POST',
        ...json(data)
      }),
    update: (id: string, data: Partial<Product>) =>
      apiFetch<{ success: boolean }>(`/api/products/${id}`, {
        method: 'PATCH',
        ...json(data)
      }),
    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/products/${id}`, { method: 'DELETE' }),
    createCheckoutSession: (items: { productId: string; quantity: number }[]) =>
      apiFetch<{ url: string }>('/api/sales/checkout', {
        method: 'POST',
        ...json({ items })
      })
  },
  sales: {
    getArtistSales: () => apiFetch<Sale[]>('/api/sales/mine?role=seller'),
    getBuyerSales: () => apiFetch<Sale[]>('/api/sales/mine?role=buyer')
  }
};
