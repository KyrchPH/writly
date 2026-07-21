"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle@1.1.2";
import { cn } from "./utils";
import styles from "./toggle.module.css";

type ToggleVariant = "default" | "outline";
type ToggleSize = "default" | "sm" | "lg";

const toggleVariants = ({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ToggleVariant;
  size?: ToggleSize;
  className?: string;
} = {}) =>
  cn(
    styles.toggle,
    variant === "outline" ? styles["toggle--outline"] : undefined,
    size === "sm"
      ? styles["toggle--size-sm"]
      : size === "lg"
      ? styles["toggle--size-lg"]
      : styles["toggle--size-default"],
    className,
  );

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & {
  variant?: ToggleVariant;
  size?: ToggleSize;
}) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
