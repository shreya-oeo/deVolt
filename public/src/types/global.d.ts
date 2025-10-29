import { ComponentProps, ReactNode } from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode
    }
    interface ElementAttributesProperty { props: {} }
    interface ElementChildrenAttribute { children: {} }

    // HTML Elements
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};