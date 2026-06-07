"use client";

import type { Disease, Product } from "@prisma/client";
import { CalendarIcon, Plus, X } from "lucide-react";
import React from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ParcelWithTreatments } from "@/lib/data-fetcher";

export interface AddTreatmentDialogFormData {
	appliedDate: Date;
	diseases: { diseaseId: string }[];
	productApplications: { productId: string; dose: number }[];
	waterDose: number;
	parcelIds: string[];
}

export interface AddTreatmentDialogFormErrors {
	appliedDate: string[];
	parcelIds: string[];
	diseases: string[];
	productApplications: string[];
	waterDose: string[];
}

interface AddTreatmentDialogFormProps {
	t: (key: string) => string;
	parcelId?: string;
	parcels?: ParcelWithTreatments[];
	diseases: Pick<Disease, "id" | "name">[];
	products: Pick<Product, "id" | "name" | "maxApplications">[];
	advisedDosePerProduct: Record<string, number>;
	formData: AddTreatmentDialogFormData;
	errors: AddTreatmentDialogFormErrors;
	onCancel: () => void;
	onSubmit: () => void;
	onPreventEnterSubmit: (event: React.KeyboardEvent<HTMLFormElement>) => void;
	onNumberInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
	onAddParcel: () => void;
	onRemoveParcel: (index: number) => void;
	onUpdateParcel: (index: number, parcelId: string) => void;
	onAddProduct: () => void;
	onRemoveProduct: (index: number) => void;
	onUpdateProduct: (
		index: number,
		field: "productId" | "dose",
		value: string | number,
	) => void;
	onAddDisease: () => void;
	onRemoveDisease: (index: number) => void;
	onUpdateDisease: (index: number, diseaseId: string) => void;
	onWaterDoseChange: (value: number) => void;
	onAppliedDateChange: (value: Date) => void;
}

export function AddTreatmentDialogForm({
	t,
	parcelId,
	parcels,
	diseases,
	products,
	advisedDosePerProduct,
	formData,
	errors,
	onCancel,
	onSubmit,
	onPreventEnterSubmit,
	onNumberInputKeyDown,
	onAddParcel,
	onRemoveParcel,
	onUpdateParcel,
	onAddProduct,
	onRemoveProduct,
	onUpdateProduct,
	onAddDisease,
	onRemoveDisease,
	onUpdateDisease,
	onWaterDoseChange,
	onAppliedDateChange,
}: AddTreatmentDialogFormProps) {
	return (
		<form
			className="flex flex-col flex-1 min-h-0"
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit();
			}}
			onKeyDown={onPreventEnterSubmit}
		>
			<div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
				<div>
					<Label>{t("treatments.applicationDate")}</Label>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="outline"
								className={cn(
									"w-full pl-3 text-left font-normal",
									!formData.appliedDate && "text-muted-foreground",
								)}
							>
								{formData.appliedDate ? (
									format(formData.appliedDate, "PPP")
								) : (
									<span>{t("treatments.pickDate")}</span>
								)}
								<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={formData.appliedDate}
								onSelect={(date) => date && onAppliedDateChange(date)}
								disabled={(date) =>
									date > new Date() || date < new Date("1900-01-01")
								}
								initialFocus
							/>
						</PopoverContent>
					</Popover>

					{errors.appliedDate.map((er) => (
						<p key={er} className="text-sm text-red-700">
							{er}
						</p>
					))}
				</div>

				{!!parcels?.length && (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label>{t("treatments.parcels")}</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onAddParcel}
							>
								<Plus className="h-4 w-4 mr-2" />
								{t("treatments.addParcel")}
							</Button>
						</div>
						{formData.parcelIds.map((pId, index) => (
							<div key={index} className="flex gap-2 items-start mb-1">
								<Select
									value={pId}
									onValueChange={(value) => onUpdateParcel(index, value)}
								>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder={t("treatments.selectParcel")} />
									</SelectTrigger>
									<SelectContent>
										{parcels.map((parcel) => (
											<SelectItem key={parcel.id} value={parcel.id}>
												{parcel.name} ({parcel.width}m × {parcel.height}m)
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{formData.parcelIds.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => onRemoveParcel(index)}
										className="mt-2"
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
						{errors.parcelIds.map((er) => (
							<p key={er} className="text-sm text-red-700">
								{er}
							</p>
						))}
					</div>
				)}

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<Label>{t("treatments.products")}</Label>
							<p className="text-sm text-muted-foreground">
								{t("treatments.dosesInGrams")}
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onAddProduct}
						>
							<Plus className="h-4 w-4 mr-2" />
							{t("treatments.addProduct")}
						</Button>
					</div>
					{formData.productApplications.map((product, index) => (
						<React.Fragment key={index}>
							<div className="flex gap-2 items-start mb-1">
								<Select
									value={product.productId}
									onValueChange={(value) =>
										onUpdateProduct(index, "productId", value)
									}
								>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder={t("treatments.selectProduct")} />
									</SelectTrigger>
									<SelectContent>
										{products.map((p) => (
											<SelectItem key={p.id} value={p.id}>
												{p.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Input
									type="number"
									inputMode="decimal"
									enterKeyHint="next"
									placeholder="gr"
									step="0.1"
									min="0.1"
									value={product.dose || ""}
									onChange={(e) =>
										onUpdateProduct(index, "dose", Number(e.target.value))
									}
									onKeyDown={onNumberInputKeyDown}
									className="w-24"
								/>
								{index > 0 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => onRemoveProduct(index)}
										className="mt-2"
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
							{advisedDosePerProduct[product.productId] &&
							advisedDosePerProduct[product.productId] < product.dose ? (
								<p className="text-sm text-orange-400">
									{t("treatments.warnings.doseAdvice")}{" "}
									{Math.round(advisedDosePerProduct[product.productId])}gr
								</p>
							) : null}
						</React.Fragment>
					))}
					{errors.productApplications.map((er) => (
						<p key={er} className="text-sm text-red-700">
							{er}
						</p>
					))}
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<Label>{t("treatments.diseases")}</Label>
							<p className="text-sm text-muted-foreground">
								{t("treatments.diseasesFromProductsHint")}
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onAddDisease}
						>
							<Plus className="h-4 w-4 mr-2" />
							{t("treatments.addDisease")}
						</Button>
					</div>
					{formData.diseases.map((disease, index) => (
						<div key={index} className="flex gap-2 items-start mb-1">
							<Select
								value={disease.diseaseId}
								onValueChange={(value) => onUpdateDisease(index, value)}
							>
								<SelectTrigger className="flex-1">
									<SelectValue placeholder={t("treatments.selectDisease")} />
								</SelectTrigger>
								<SelectContent>
									{diseases
										.filter(
											(d) =>
												d.id === disease.diseaseId ||
												!formData.diseases.some(
													(fd, i) => i !== index && fd.diseaseId === d.id,
												),
										)
										.map((d) => (
											<SelectItem key={d.id} value={d.id}>
												{d.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
							{index > 0 && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => onRemoveDisease(index)}
									className="mt-2"
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					))}
					{errors.diseases.map((er) => (
						<p key={er} className="text-sm text-red-700">
							{er}
						</p>
					))}
				</div>

				<div>
					<Label htmlFor="waterDose">{t("treatments.waterDose")}</Label>
					<Input
						id="waterDose"
						name="waterDose"
						type="number"
						inputMode="decimal"
						enterKeyHint="done"
						step="0.1"
						min="0"
						value={formData.waterDose}
						onChange={(e) => onWaterDoseChange(Number(e.target.value))}
						onKeyDown={onNumberInputKeyDown}
					/>
					{errors.waterDose.map((er) => (
						<p key={er} className="text-sm text-red-700">
							{er}
						</p>
					))}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					{t("treatments.cancel")}
				</Button>
				<Button
					type="button"
					className="bg-main-gradient hover:bg-primary-700"
					onClick={onSubmit}
				>
					{t("treatments.createTreatment")}
				</Button>
			</DialogFooter>
		</form>
	);
}
