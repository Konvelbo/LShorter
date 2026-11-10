declare module 'lenis' {
  export interface LenisOptions {
    duration?: number;
    easing?: (t: number) => number;
    orientation?: 'vertical' | 'horizontal';
    gestureOrientation?: 'vertical' | 'horizontal';
    smoothWheel?: boolean;
    wheelMultiplier?: number;
    touchMultiplier?: number;
    infinite?: boolean;
    wrapper?: HTMLElement | Window;
    content?: HTMLElement;
  }

  export default class Lenis {
    constructor(options?: LenisOptions);
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    raf(time: number): void;
    destroy(): void;
    scrollTo(target: any, options?: any): void;
    stop(): void;
    start(): void;
  }
}

declare module '@studio-freight/lenis' {
  import Lenis from 'lenis';
  export default Lenis;
}
