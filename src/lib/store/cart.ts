import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/types';

export interface CartItem {
  id?: string;
  product: Product;
  quantity: number; // Cantidad en unidades individuales
  packageCount: number; // Cantidad en bultos/fardos
  selectedColor?: string;
  customNotes?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, packagesToAdd?: number, selectedColor?: string) => void;
  updatePackageCount: (itemKeyOrProductId: string, packageCount: number) => void;
  removeItem: (itemKeyOrProductId: string) => void;
  clearCart: () => void;
  clearTenantCart: (tenantId: string) => void;
  getTenantItems: (tenantId: string) => CartItem[];
  getTotalUnits: (tenantId?: string) => number;
  getTotalPackages: (tenantId?: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product, packagesToAdd = 1, selectedColor) => {
        set((state) => {
          const packSize = product.units_per_package || 100;
          const minQty = product.min_order_qty || packSize;
          const minPacks = Math.ceil(minQty / packSize);
          const colorKey = (selectedColor || 'Estándar').trim().toLowerCase();
          const targetItemId = `${product.id}__${colorKey}`;

          const existingIndex = state.items.findIndex((item) => {
            const currentItemKey = item.id || `${item.product.id}__${(item.selectedColor || 'Estándar').trim().toLowerCase()}`;
            return currentItemKey === targetItemId;
          });

          if (existingIndex > -1) {
            const currentItem = state.items[existingIndex];
            const newPacks = currentItem.packageCount + packagesToAdd;
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...currentItem,
              id: targetItemId,
              packageCount: newPacks,
              quantity: newPacks * packSize,
              selectedColor: selectedColor || currentItem.selectedColor,
            };
            return { items: updatedItems, isOpen: true };
          }

          // Nuevo ítem: asegurar que arranque al menos con el MOQ en paquetes
          const initialPacks = Math.max(packagesToAdd, minPacks);
          const newItem: CartItem = {
            id: targetItemId,
            product,
            packageCount: initialPacks,
            quantity: initialPacks * packSize,
            selectedColor: selectedColor || 'Estándar',
          };

          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      updatePackageCount: (itemKeyOrProductId, packageCount) => {
        set((state) => {
          const updatedItems = state.items.map((item) => {
            const currentItemKey = item.id || `${item.product.id}__${(item.selectedColor || 'Estándar').trim().toLowerCase()}`;
            if (currentItemKey === itemKeyOrProductId || item.product.id === itemKeyOrProductId) {
              const packSize = item.product.units_per_package || 100;
              const minQty = item.product.min_order_qty || packSize;
              const minPacks = Math.ceil(minQty / packSize);
              const finalPacks = Math.max(packageCount, minPacks);

              return {
                ...item,
                packageCount: finalPacks,
                quantity: finalPacks * packSize,
              };
            }
            return item;
          });
          return { items: updatedItems };
        });
      },

      removeItem: (itemKeyOrProductId) => {
        set((state) => ({
          items: state.items.filter((item) => {
            const currentItemKey = item.id || `${item.product.id}__${(item.selectedColor || 'Estándar').trim().toLowerCase()}`;
            return currentItemKey !== itemKeyOrProductId && item.product.id !== itemKeyOrProductId;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      clearTenantCart: (tenantId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.tenant_id !== tenantId),
        }));
      },

      getTenantItems: (tenantId: string) => {
        return get().items.filter((item) => item.product.tenant_id === tenantId);
      },

      getTotalUnits: (tenantId?: string) => {
        const items = tenantId
          ? get().items.filter((item) => item.product.tenant_id === tenantId)
          : get().items;
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPackages: (tenantId?: string) => {
        const items = tenantId
          ? get().items.filter((item) => item.product.tenant_id === tenantId)
          : get().items;
        return items.reduce((sum, item) => sum + item.packageCount, 0);
      },
    }),
    {
      name: 'tenddy-b2b-cart',
    }
  )
);
