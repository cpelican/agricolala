"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Disease, Product } from "@prisma/client";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { type z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createTreatmentSchema } from "@/app/api/treatments/schema";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddTreatmentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	parcelId: string;
	diseases: Pick<Disease, "id" | "name">[];
	products: Pick<Product, "id" | "name">[];
}

export function AddTreatmentDialog({
	open,
	onOpenChange,
	parcelId,
	diseases,
	products,
}: AddTreatmentDialogProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const form = useForm<z.infer<typeof createTreatmentSchema>>({
		resolver: zodResolver(createTreatmentSchema),
		defaultValues: {
			diseases: [{ diseaseId: "" }],
			waterDose: 10,
			productApplications: [{ productId: "", dose: undefined }],
		},
		mode: "onChange",
	});

	const {
		fields: diseaseFields,
		append: appendDisease,
		remove: removeDisease,
	} = useFieldArray({
		control: form.control,
		name: "diseases",
	});

	const {
		fields: productFields,
		append: appendProduct,
		remove: removeProduct,
	} = useFieldArray({
		control: form.control,
		name: "productApplications",
	});

	const onSubmit = async (values: z.infer<typeof createTreatmentSchema>) => {
		try {
			setLoading(true);
			const response = await fetch("/api/treatments", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...values,
					parcelId,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to create treatment");
			}

			router.refresh();
			onOpenChange(false);
			form.reset();
		} catch (error) {
			console.error("Error creating treatment:", error);
		} finally {
			setLoading(false);
		}
	};

	const isFormValid = form.formState.isValid;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Treatment</DialogTitle>
					<DialogDescription>
						Add a new treatment for this parcel. Fill in the details below.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="appliedDate"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Application Date</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant={"outline"}
													className={cn(
														"w-full pl-3 text-left font-normal",
														!field.value && "text-muted-foreground",
													)}
												>
													{field.value ? (
														format(field.value, "PPP")
													) : (
														<span>Pick a date</span>
													)}
													<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												disabled={(date) =>
													date > new Date() || date < new Date("1900-01-01")
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<FormLabel>Diseases</FormLabel>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => appendDisease({ diseaseId: "" })}
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Disease
								</Button>
							</div>
							{diseaseFields.map((field, index) => (
								<div key={field.id} className="flex gap-2 items-start">
									<FormField
										control={form.control}
										name={`diseases.${index}.diseaseId`}
										render={({ field }) => (
											<FormItem className="flex-1">
												<FormControl>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select disease" />
														</SelectTrigger>
														<SelectContent>
															{diseases.map((disease) => (
																<SelectItem key={disease.id} value={disease.id}>
																	{disease.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{index > 0 && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => removeDisease(index)}
											className="mt-2"
										>
											<X className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<FormLabel>Products</FormLabel>
									<p className="text-sm text-muted-foreground">
										Doses in grams (g)
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => appendProduct({ productId: "", dose: 0 })}
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Product
								</Button>
							</div>
							{productFields.map((field, index) => (
								<div key={field.id} className="flex gap-2 items-start">
									<FormField
										control={form.control}
										name={`productApplications.${index}.productId`}
										render={({ field }) => (
											<FormItem className="flex-1">
												<FormControl>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select product" />
														</SelectTrigger>
														<SelectContent>
															{products.map((product) => (
																<SelectItem key={product.id} value={product.id}>
																	{product.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name={`productApplications.${index}.dose`}
										render={({ field }) => (
											<FormItem className="w-24">
												<FormControl>
													<Input
														type="number"
														placeholder="gr"
														step="0.1"
														min="0.1"
														{...field}
														onChange={(e) =>
															field.onChange(Number(e.target.value))
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{index > 0 && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => removeProduct(index)}
											className="mt-2"
										>
											<X className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}
						</div>

						<FormField
							control={form.control}
							name="waterDose"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Water Dose (L)</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.1"
											min="0"
											{...field}
											onChange={(e) => field.onChange(Number(e.target.value))}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type="submit" disabled={loading || !isFormValid}>
								{loading ? "Creating..." : "Create Treatment"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
