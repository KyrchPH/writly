"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react@0.487.0";
import { DayPicker } from "react-day-picker@8.10.1";

import { cn } from "./utils";
import { buttonVariants } from "./button";
import styles from "./calendar.module.css";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(styles.calendar, className)}
      classNames={{
        months: styles["calendar__months"],
        month: styles["calendar__month"],
        caption: styles["calendar__caption"],
        caption_label: styles["calendar__captionLabel"],
        nav: styles["calendar__nav"],
        nav_button: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          styles["calendar__navButton"],
        ),
        nav_button_previous: styles["calendar__navButtonPrev"],
        nav_button_next: styles["calendar__navButtonNext"],
        table: styles["calendar__table"],
        head_row: styles["calendar__headRow"],
        head_cell: styles["calendar__headCell"],
        row: styles["calendar__row"],
        cell: cn(
          styles["calendar__cell"],
          props.mode === "range"
            ? styles["calendar__cell--range"]
            : styles["calendar__cell--single"],
        ),
        day: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          styles["calendar__day"],
        ),
        day_range_start: styles["calendar__day--rangeStart"],
        day_range_end: styles["calendar__day--rangeEnd"],
        day_selected: styles["calendar__day--selected"],
        day_today: styles["calendar__day--today"],
        day_outside: styles["calendar__day--outside"],
        day_disabled: styles["calendar__day--disabled"],
        day_range_middle: styles["calendar__day--rangeMiddle"],
        day_hidden: styles["calendar__day--hidden"],
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft
            className={cn(styles.calendar__icon, className)}
            {...props}
          />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight
            className={cn(styles.calendar__icon, className)}
            {...props}
          />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
