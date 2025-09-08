"use client";

import * as React from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

// DaisyUI-flavored Sonner Toaster
// Maps Sonner parts to DaisyUI classes (alert, btn, etc.) and relies on the
// page's data-theme for colors.
const Toaster = ({ toastOptions, position, ...props }: ToasterProps) => {
  return (
    <Sonner
      {...props}
      position={position ?? "top-right"}
      theme={"system"}
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            "alert bg-base-200 border border-base-300 text-base-content shadow", // container
          title: "font-semibold",
          description: "opacity-90",
          icon: "size-5",
          actionButton: "btn btn-primary btn-sm",
          cancelButton: "btn btn-ghost btn-sm",
          closeButton: "btn btn-ghost btn-xs",
          ...toastOptions?.classNames,
        },
      }}
    />
  );
};

export { Toaster };
