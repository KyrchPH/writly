import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cn } from "./utils";
import styles from "./badge.module.css";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const badgeVariants = ({
  variant = "default",
  className,
}: { variant?: BadgeVariant; className?: string } = {}) =>
  cn(
    styles.badge,
    variant === "secondary"
      ? styles["badge--secondary"]
      : variant === "destructive"
      ? styles["badge--destructive"]
      : variant === "outline"
      ? styles["badge--outline"]
      : styles["badge--default"],
    className,
  );

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant; asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
