import { create } from 'zustand';

interface StoreState {
  isCommandPaletteOpen: boolean;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isSidebarMinimized: boolean;
  toggleSidebarMinimized: () => void;
  setSidebarMinimized: (minimized: boolean) => void;
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  isRightSidebarExpanded: boolean;
  toggleRightSidebarExpanded: () => void;
  setRightSidebarOpen: (open: boolean) => void;
}

const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
const initialSidebarOpen = localStorage.getItem('isSidebarOpen') !== null
  ? localStorage.getItem('isSidebarOpen') !== 'false'
  : !isMobile;
const initialSidebarMinimized = localStorage.getItem('isSidebarMinimized') === 'true';
const initialRightSidebarOpen = localStorage.getItem('isRightSidebarOpen') !== null
  ? localStorage.getItem('isRightSidebarOpen') !== 'false'
  : !isMobile;

export const useStore = create<StoreState>((set) => ({
  isCommandPaletteOpen: false,
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  isSidebarOpen: initialSidebarOpen,
  toggleSidebar: () => set((state) => {
    const nextVal = !state.isSidebarOpen;
    localStorage.setItem('isSidebarOpen', String(nextVal));
    return { isSidebarOpen: nextVal };
  }),
  isSidebarMinimized: initialSidebarMinimized,
  toggleSidebarMinimized: () => set((state) => {
    const nextVal = !state.isSidebarMinimized;
    localStorage.setItem('isSidebarMinimized', String(nextVal));
    return { isSidebarMinimized: nextVal };
  }),
  setSidebarMinimized: (minimized) => set(() => {
    localStorage.setItem('isSidebarMinimized', String(minimized));
    return { isSidebarMinimized: minimized };
  }),
  isRightSidebarOpen: initialRightSidebarOpen,
  toggleRightSidebar: () => set((state) => {
    const nextVal = !state.isRightSidebarOpen;
    localStorage.setItem('isRightSidebarOpen', String(nextVal));
    return { isRightSidebarOpen: nextVal };
  }),
  isRightSidebarExpanded: false,
  toggleRightSidebarExpanded: () => set((state) => ({ isRightSidebarExpanded: !state.isRightSidebarExpanded })),
  setRightSidebarOpen: (open) => set(() => {
    localStorage.setItem('isRightSidebarOpen', String(open));
    return { isRightSidebarOpen: open };
  }),
}));
