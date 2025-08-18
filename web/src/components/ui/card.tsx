import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border bg-white/60 dark:bg-black/40 backdrop-blur p-4", className)} {...props} />;
}


