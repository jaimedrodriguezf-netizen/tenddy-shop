import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/types';

export interface CartItem {
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
  updatePackageCount: (productId: string, packageCount: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotalUnits: () => number;
  getTotalPackages: () => number;
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

          const existingIndex = state.items.findIndex(
            (item) => item.product.id === product.id
          );

          if (existingIndex > -1) {
            const currentItem = state.items[existingIndex];
            const newPacks = currentItem.packageCount + packagesToAdd;
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...currentItem,
              packageCount: newPacks,
              quantity: newPacks * packSize,
              selectedColor: selectedColor || currentItem.selectedColor,
            };
            return { items: updatedItems, isOpen: true };
          }

          // Nuevo ítem: asegurar que arranque al menos con el MOQ en paquetes
          const initialPacks = Math.max(packagesToAdd, minPacks);
          const newItem: CartItem = {
            product,
            packageCount: initialPacks,
            quantity: initialPacks * packSize,
            selectedColor: selectedColor || 'Estándar',
          };

          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      updatePackageCount: (productId, packageCount) => {
        set((state) => {
          const updatedItems = state.items.map((item) => {
            if (item.product.id === productId) {
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

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalUnits: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPackages: () => {
        return get().items.reduce((sum, item) => sum + item.packageCount, 0);
      },
    }),
    {
      name: 'tenddy-b2b-cart',
    }
  )
);
