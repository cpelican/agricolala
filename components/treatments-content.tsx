"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Droplets } from "lucide-react"
import { format } from "date-fns"
import { ParcelWithTreatments } from './types'


interface TreatmentsContentProps {
  treatments: ParcelWithTreatments['treatments']
}

export function TreatmentsContent({ treatments }: TreatmentsContentProps) {
  const upcomingTreatments = treatments.filter((t) => t.status === "TODO")
  const completedTreatments = treatments.filter((t) => t.status === "DONE")

  if (treatments.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No Treatments Yet</CardTitle>
            <CardDescription>Treatments will appear here once you add parcels and schedule treatments</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {upcomingTreatments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-orange-500" />
            Upcoming Treatments ({upcomingTreatments.length})
          </h2>
          <div className="space-y-3">
            {upcomingTreatments.map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))}
          </div>
        </div>
      )}

      {completedTreatments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-500" />
            Completed Treatments ({completedTreatments.length})
          </h2>
          <div className="space-y-3">
            {completedTreatments.map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TreatmentCard({ treatment }: { treatment: ParcelWithTreatments['treatments'][number] }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm text-gray-600">Target: {treatment.diseaseIds.map((diseaseId) => {
              return diseaseId
            }).join(", ")}</p>
          </div>
          <Badge variant={treatment.status === "DONE" ? "default" : "secondary"}>
            {treatment.status === "DONE" ? "Completed" : "Pending"}
          </Badge>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          {treatment.parcel.name}
        </div>

        {treatment.dateMin && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar className="h-4 w-4 mr-1" />
            {treatment.status === "DONE" && treatment.appliedDate
              ? `Applied: ${format(new Date(treatment.appliedDate), "MMM dd, yyyy")}`
              : `Scheduled: ${format(new Date(treatment.dateMin), "MMM dd")} - ${
                  treatment.dateMax ? format(new Date(treatment.dateMax), "MMM dd, yyyy") : "Open"
                }`}
          </div>
        )}

        {treatment.waterDose && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Droplets className="h-4 w-4 mr-1" />
            Water: {treatment.waterDose}L/ha
          </div>
        )}

        {treatment.productApplications.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Products Used:</p>
            <div className="space-y-1">
              {treatment.productApplications.map((app, index) => (
                <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <div className="font-medium">
                    {app.product.brand} {app.product.name}
                  </div>
                  <div>Dose: {app.dose}g/ha</div>
                  {app.product.composition.length > 0 && (
                    <div className="text-xs mt-1">
                      Active substances: {app.product.composition.map((c) => c.substance.name).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
