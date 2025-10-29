import { create } from "zustand";

interface PageLoader {
  initialLoad: boolean;
  setInitialLoad: (initialLoad: boolean) => void;
}

export const usePageLoaderStore = create<PageLoader>((set) => ({
  initialLoad: true,
  setInitialLoad: (initialLoad: boolean) => set({ initialLoad }),
}));
