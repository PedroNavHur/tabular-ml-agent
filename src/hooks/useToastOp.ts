import { useCallback, useState } from "react";
import { toast } from "sonner";

export type ToastMessages = {
  loading: string;
  success: string | ((data: unknown) => string);
  error: string | ((err: unknown) => string);
};

export function useToastOp(defaultMessages?: Partial<ToastMessages>) {
  const [inFlight, setInFlight] = useState(false);

  const run = useCallback(
    async <T>(
      op: () => Promise<T>,
      messages?: Partial<ToastMessages>
    ): Promise<T> => {
      if (inFlight) throw new Error("Operation already in progress");
      setInFlight(true);
      try {
        const msgs: ToastMessages = {
          loading:
            messages?.loading ?? defaultMessages?.loading ?? "Working...",
          success: messages?.success ?? defaultMessages?.success ?? "Done",
          error:
            messages?.error ?? defaultMessages?.error ?? "Something went wrong",
        } as ToastMessages;
        const promise = op();
        toast.promise(promise, msgs);
        const result = await promise;
        return result;
      } finally {
        setInFlight(false);
      }
    },
    [inFlight, defaultMessages]
  );

  return { run, inFlight } as const;
}
