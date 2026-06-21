import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import { Toaster } from "sonner";

const NotificationToaster = () => (
  <Toaster
    position="top-right"
    duration={4500}
    closeButton
    gap={12}
    icons={{
      success: <CheckCircle2 className="h-5 w-5" />,
      error: <XCircle className="h-5 w-5" />,
      warning: <AlertTriangle className="h-5 w-5" />,
      info: <Info className="h-5 w-5" />,
      loading: <Loader2 className="h-5 w-5 animate-spin" />,
    }}
    toastOptions={{
      classNames: {
        toast:
          "!min-h-16 !rounded-2xl !border !border-border !bg-background/95 !px-5 !py-4 !text-foreground !shadow-2xl !backdrop-blur-xl",
        title: "!text-sm !font-semibold !text-foreground",
        description: "!text-sm !text-muted-foreground",
        success:
          "!border-emerald-500/35 !bg-emerald-50/95 !text-emerald-700 dark:!bg-emerald-950/95 dark:!text-emerald-300",
        error:
          "!border-red-500/35 !bg-red-50/95 !text-red-700 dark:!bg-red-950/95 dark:!text-red-300",
        warning:
          "!border-amber-500/50 !bg-amber-100/75 !text-amber-900 dark:!border-amber-500/35 dark:!bg-amber-950/95 dark:!text-amber-300",
        info:
          "!border-blue-500/35 !bg-blue-50/95 !text-blue-700 dark:!bg-blue-950/95 dark:!text-blue-300",
        closeButton:
          "!left-auto !right-2 !top-2 !h-6 !w-6 !translate-x-0 !translate-y-0 !border-border !bg-background !text-muted-foreground hover:!text-foreground",
      },
    }}
  />
);

export default NotificationToaster;
