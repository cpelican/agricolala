"use client";

import { MapPin, X, ChevronRight } from "lucide-react";
import { LocaleLink } from "../locale/locale-link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddParcelDialog } from "./add-parcel-dialog";
import { ParcelMapWrapper } from "./parcel-map-wrapper";
import { type ParcelWithTreatments } from "@/lib/data-fetcher";
import { useTranslations } from "@/contexts/translations-context";
import {
	type ParcelBoundary,
	type ParcelBoundaryPoint,
	computeParcelAreaM2,
	formatParcelAreaDisplay,
} from "@/lib/parcel-geometry";

interface ParcelsContentProps {
	parcels: ParcelWithTreatments[];
}

export function ParcelsContent({ parcels }: ParcelsContentProps) {
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showEmptyState, setShowEmptyState] = useState(true);
	const [isDrawing, setIsDrawing] = useState(false);
	const [draftVertices, setDraftVertices] = useState<ParcelBoundaryPoint[]>([]);
	const [completedBoundary, setCompletedBoundary] =
		useState<ParcelBoundary | null>(null);
	const { t } = useTranslations();

	const handleStartDrawing = () => {
		setIsDrawing(true);
		setDraftVertices([]);
		setCompletedBoundary(null);
		setShowEmptyState(false);
	};

	const handleVertexAdd = (lat: number, lng: number) => {
		if (!isDrawing) {
			return;
		}
		setDraftVertices((prev) => [...prev, { lat, lng }]);
	};

	const handleUndoPoint = () => {
		setDraftVertices((prev) => prev.slice(0, -1));
	};

	const handleCancelDrawing = () => {
		setIsDrawing(false);
		setDraftVertices([]);
		setCompletedBoundary(null);
	};

	const handleFinishShape = () => {
		if (draftVertices.length < 3) {
			return;
		}
		setCompletedBoundary([...draftVertices]);
		setIsDrawing(false);
		setShowAddDialog(true);
	};

	return (
		<div className="p-4 space-y-4">
			<div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
				<p className="text-sm text-gray-500">
					{isDrawing
						? t("parcels.drawInstructions")
						: t("parcels.drawParcelHint")}
				</p>
				{!isDrawing && !showAddDialog && (
					<Button type="button" onClick={handleStartDrawing}>
						{t("parcels.drawParcel")}
					</Button>
				)}
			</div>

			<Card>
				<CardContent className="p-0 relative">
					<ParcelMapWrapper
						parcels={parcels}
						drawing={
							isDrawing
								? { vertices: draftVertices, onVertexAdd: handleVertexAdd }
								: undefined
						}
					/>
					{isDrawing && (
						<div className="absolute bottom-3 left-3 right-3 z-[1000] flex flex-wrap gap-2 justify-center">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleUndoPoint}
								disabled={draftVertices.length === 0}
								aria-label={t("parcels.undoPoint")}
							>
								{t("parcels.undoPoint")}
							</Button>
							<Button
								type="button"
								size="sm"
								onClick={handleFinishShape}
								disabled={draftVertices.length < 3}
								aria-label={t("parcels.finishShape")}
							>
								{t("parcels.finishShape")}
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={handleCancelDrawing}
								aria-label={t("parcels.cancelDrawing")}
							>
								{t("parcels.cancelDrawing")}
							</Button>
						</div>
					)}
					{parcels.length === 0 && showEmptyState && !isDrawing && (
						<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 p-8 rounded-lg shadow-lg text-center max-w-xs">
							<Button
								variant="ghost"
								size="sm"
								className="absolute top-3 right-3 h-6 w-6 p-0"
								onClick={() => setShowEmptyState(false)}
							>
								<X className="h-4 w-4" />
							</Button>
							<p className="text-gray-700 font-medium">
								{t("parcels.clickMapToAddFirst")}
							</p>
							<p className="text-sm text-gray-500 mt-1">
								{t("parcels.zoomInToFindLocation")}
							</p>
							<Button
								type="button"
								className="mt-4"
								onClick={handleStartDrawing}
							>
								{t("parcels.drawParcel")}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{parcels.length > 0 && (
				<div className="grid gap-4">
					{parcels.map((parcel) => (
						<Card key={parcel.id}>
							<CardContent className="p-4 flex justify-between items-start items-center">
								<LocaleLink href={`/parcels/${parcel.id}`} className="flex-1">
									<div>
										<h3 className="font-medium">{parcel.name}</h3>
										<p className="text-sm text-gray-600 capitalize">
											{parcel.type.toLowerCase()}
										</p>
										<p className="text-sm text-gray-500">
											{formatParcelAreaDisplay(parcel)}
										</p>
										<div className="flex items-center text-gray-400 mt-2">
											<MapPin className="h-4 w-4 mr-1" />
											<span className="text-xs">
												{parcel.latitude.toFixed(4)},{" "}
												{parcel.longitude.toFixed(4)}
											</span>
										</div>
									</div>
								</LocaleLink>
								<div className="">
									<ChevronRight className="h-6 w-6 text-gray-400" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			<AddParcelDialog
				open={showAddDialog}
				onOpenChange={(open) => {
					setShowAddDialog(open);
					if (!open) {
						setCompletedBoundary(null);
						setDraftVertices([]);
					}
				}}
				boundary={completedBoundary}
				previewAreaM2={
					completedBoundary ? computeParcelAreaM2(completedBoundary) : undefined
				}
			/>
		</div>
	);
}
