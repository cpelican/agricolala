"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	...props
}: CalendarProps) {
	// Class keys follow react-day-picker v9 (month_grid, weekdays, day_button, …).
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("p-3", className)}
			classNames={{
				root: "relative w-fit",
				months: "flex flex-col sm:flex-row gap-4",
				month: "flex flex-col gap-4",
				month_caption: "flex h-10 items-center justify-center",
				caption_label: "text-sm font-medium",
				nav: "absolute inset-x-3 top-3 flex h-10 items-center justify-between",
				button_previous: cn(
					buttonVariants({ variant: "outline" }),
					"h-10 w-10 p-0 bg-transparent aria-disabled:opacity-30 aria-disabled:pointer-events-none",
				),
				button_next: cn(
					buttonVariants({ variant: "outline" }),
					"h-10 w-10 p-0 bg-transparent aria-disabled:opacity-30 aria-disabled:pointer-events-none",
				),
				month_grid: "w-full border-collapse",
				weekdays: "grid grid-cols-7",
				weekday:
					"flex h-8 items-center justify-center text-[0.8rem] font-normal text-muted-foreground",
				week: "mt-1 grid grid-cols-7",
				day: "group/day flex items-center justify-center p-0 text-center text-sm",
				day_button: cn(
					buttonVariants({ variant: "ghost" }),
					"h-10 w-10 p-0 font-normal",
					"group-data-[selected=true]/day:bg-primary group-data-[selected=true]/day:text-primary-foreground group-data-[selected=true]/day:font-semibold group-data-[selected=true]/day:hover:bg-primary",
					"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				),
				selected: "",
				today:
					"[&:not([data-selected=true])>button]:bg-accent [&:not([data-selected=true])>button]:text-accent-foreground",
				outside: "text-muted-foreground opacity-50",
				disabled: "text-muted-foreground",
				hidden: "invisible",
				...classNames,
			}}
			components={{
				Chevron: ({ orientation }): React.ReactElement =>
					orientation === "left" ? (
						<ChevronLeft className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					),
			}}
			{...props}
		/>
	);
}
Calendar.displayName = "Calendar";

export { Calendar };
