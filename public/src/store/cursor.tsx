import { ClassValue } from "clsx";
import { create } from "zustand";

export const ROUNDING_DEFAULT = 144;

const DEFAULT_CURSOR = {
  _scaleMultiplier: 1,
  scale: 1,
  content: <></>,
  opacity: 0,
  mass: 0,
  className: "",
  style: {},
  rounding: ROUNDING_DEFAULT,
};

interface Cursor {
  // getters
  _scaleMultiplier: number;
  scale: number;
  content: JSX.Element;
  opacity: number;
  className: ClassValue[] | string;
  style: React.CSSProperties;
  rounding: number;
  mass: number;
  enabled: boolean,

  // setters
  setScale: (scale: number) => void;
  setContent: (content: JSX.Element) => void;
  setOpacity: (opacity: number) => void;
  setClassName: (className: string) => void;
  setStyle: (style: React.CSSProperties) => void;
  setRounding: (rounding: number) => void;
  setScaleMultiplier: (multiplier: number) => void;

  // reset
  reset: () => void;
}

export const useCursorStore = create<Cursor>((set) => ({
  ...DEFAULT_CURSOR,
  enabled:false,

  setScale: (scale: number) => set({ scale, mass: scale }),
  setContent: (content: JSX.Element) => set({ content }),
  setOpacity: (opacity: number) => set({ opacity }),
  setClassName: (className: string) => set({ className }),
  setStyle: (style: React.CSSProperties) => set({ style }),
  setRounding: (rounding: number) => set({ rounding }),
  setScaleMultiplier: (_scaleMultiplier: number) => set({ _scaleMultiplier }),

  reset: () => set(DEFAULT_CURSOR),
}));
