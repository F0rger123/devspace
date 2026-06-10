import { create } from 'zustand';

interface StoreState {
  isCommandPaletteOpen: boolean;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  isRightSidebarExpanded: boolean;
  toggleRightSidebarExpanded: () => void;
  setRightSidebarOpen: (open: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  isCommandPaletteOpen: false,
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  isRightSidebarOpen: true,
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  isRightSidebarExpanded: false,
  toggleRightSidebarExpanded: () => set((state) => ({ isRightSidebarExpanded: !state.isRightSidebarExpanded })),
  setRightSidebarOpen: (open) => set({ isRightSidebarOpen: open }),
}));
