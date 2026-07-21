import * as React from "react";
import { cn } from "./utils";
import styles from "./alert.module.css";

type AlertVariant = "default" | "destructive";

const alertVariants = ({
  variant = "default",
  className,
}: { variant?: AlertVariant; className?: string } = {}) =>
  cn(
    styles.alert,
    variant === "destructive" ? styles["alert--destructive"] : styles["alert--default"],
    className,
  );

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: AlertVariant }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(styles["alert__title"], className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(styles["alert__description"], className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
