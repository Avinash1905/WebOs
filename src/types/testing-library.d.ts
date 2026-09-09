import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toHaveAttribute(attr: string, value?: string): T;
    toHaveClass(className: string): T;
    toHaveTextContent(text: string): T;
    toBeVisible(): T;
  }
}

declare module '@testing-library/react' {
  export const screen: any;
  export const fireEvent: any;
  export const render: any;
  export const renderHook: any;
  export const act: any;
  export const cleanup: any;
  export const waitFor: any;
}
