import { apiFetch, json } from './apiFetch';
import { Product, Sale } from '../types';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';

export const commerceApi = {
  products: {
    getAll: async () => {
      try {
        const q = query(collection(db, 'products'), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Product));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, 'products');
      }
    },
    getById: async (id: string): Promise<Product | null> => {
      try {
        const snap = await getDoc(doc(db, 'products', id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as unknown as Product;
      } catch (error) {
        return handleFirestoreError(error, OperationType.GET, `products/${id}`);
      }
    },
    getArtistProducts: async (artistId: string) => {
      try {
        const q = query(collection(db, 'products'), where('sellerId', '==', artistId), where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Product));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, `products/artist/${artistId}`);
      }
    },
    create: async (data: Partial<Product>) => {
      if (!auth.currentUser) throw new Error('Not authenticated');
      try {
        const docRef = await addDoc(collection(db, 'products'), {
          ...data,
          sellerId: auth.currentUser.uid,
          status: 'active',
          createdAt: serverTimestamp()
        });
        return { id: docRef.id, success: true };
      } catch (error) {
        return handleFirestoreError(error, OperationType.CREATE, 'products');
      }
    },
    update: async (id: string, data: Partial<Product>) => {
      try {
        await updateDoc(doc(db, 'products', id), data);
        return { success: true };
      } catch (error) {
        return handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
      }
    },
    delete: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'products', id));
        return { success: true };
      } catch (error) {
        return handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    },
    createCheckoutSession: (items: { productId: string; quantity: number }[]) => apiFetch<{ url: string }>('/api/sales/checkout', {
      method: 'POST',
      ...json({ items })
    })
  },
  sales: {
    getArtistSales: async () => {
      if (!auth.currentUser) throw new Error('Not authenticated');
      try {
        const q = query(collection(db, 'sales'), where('sellerId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Sale));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, 'sales');
      }
    },
    getBuyerSales: async () => {
      if (!auth.currentUser) throw new Error('Not authenticated');
      try {
        const q = query(collection(db, 'sales'), where('buyerId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Sale));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, 'sales');
      }
    }
  }
};
