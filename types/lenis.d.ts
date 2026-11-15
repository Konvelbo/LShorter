declare module 'lenis' {
  export interface LenisOptions {
    wrapper?: HTMLElement | Window;
    content?: HTMLElement;
    eventsTarget?: HTMLElement | Window;
    smoothWheel?: boolean;
    syncTouch?: boolean;
    syncTouchLerp?: number;
    touchInertiaExponent?: number;
    duration?: number;
    easing?: (t: number) => number;
    lerp?: number;
    infinite?: boolean;
    orientation?: 'vertical' | 'horizontal';
    gestureOrientation?: 'vertical' | 'horizontal' | 'both';
    touchMultiplier?: number;
    wheelMultiplier?: number;
    autoResize?: boolean;
    prevent?: (node: HTMLElement) => boolean;
    virtualScroll?: any;
    overscroll?: boolean;
    autoRaf?: boolean;
    anchors?: boolean;
    autoToggle?: boolean;
    allowNestedScroll?: boolean;
    respectReducedMotion?: boolean;
  }

  export default class Lenis {
    constructor(options?: LenisOptions);
    on(event: string, callback: (...args: any[]) => void): () => void;
    off(event: string, callback: (...args: any[]) => void): void;
    raf(time: number): void;
    destroy(): void;
    scrollTo(target: any, options?: any): void;
    stop(): void;
    start(): void;
    resize(): void;
    isStopped: boolean;
    isSmooth: boolean;
    options: LenisOptions;
  }
}

declare module '@studio-freight/lenis' {
  import Lenis from 'lenis';
  export * from 'lenis';
  export default Lenis;
}
