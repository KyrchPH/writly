import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cn } from "./utils";
import styles from "./button.module.css";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default: styles["button--default"],
  destructive: styles["button--destructive"],
  outline: styles["button--outline"],
  secondary: styles["button--secondary"],
  ghost: styles["button--ghost"],
  link: styles["button--link"],
};

const sizeClasses: Record<ButtonSize, string> = {
  default: styles["button--size-default"],
  sm: styles["button--size-sm"],
  lg: styles["button--size-lg"],
  icon: styles["button--size-icon"],
};

const buttonVariants = ({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) =>
  cn(styles.button, variantClasses[variant], sizeClasses[size], className);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
