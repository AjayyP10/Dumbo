declare module "react-hot-toast" {
  import * as React from "react";

  export interface ToasterProps {
    position?:
      | "top-left"
      | "top-center"
      | "top-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right";
    reverseOrder?: boolean;
    gutter?: number;
    toastOptions?: {
      duration?: number;
      [key: string]: any;
    };
  }

  export const Toaster: React.FC<ToasterProps>;

  type ToastFn = (message: React.ReactNode, options?: any) => string;

  interface ToastExport extends ToastFn {
    success: ToastFn;
    error: ToastFn;
    loading: ToastFn;
    dismiss: (id?: string) => void;
    remove: (id?: string) => void;
  }

  const toast: ToastExport;
  export default toast;
}
