"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MapPin } from "lucide-react"
import { AddParcelDialog } from "./add-parcel-dialog"
import { ParcelMap } from "./parcel-map"
import Link from "next/link"

interface Parcel {
  id: string
  name: string
  latitude: number
  longitude: number
  width: number
  height: number
  type: string
}

interface ParcelsContentProps {
  parcels: Parcel[]
}

export function ParcelsContent({ parcels }: ParcelsContentProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
    setShowAddDialog(true)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Parcels</h2>
        {parcels.length > 0 && (
          <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Parcel
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <ParcelMap
            parcels={parcels}
            onMapClick={handleMapClick}
          />
          {parcels.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 p-4 rounded-lg shadow-lg text-center">
              <p className="text-gray-700 font-medium">Click on the map to add your first parcel</p>
              <p className="text-sm text-gray-500 mt-1">Zoom in to find your exact location</p>
            </div>
          )}
        </CardContent>
      </Card>

      {parcels.length > 0 && (
        <div className="grid gap-4">
          {parcels.map((parcel) => (
            <Card key={parcel.id}>
              <CardContent className="p-4">
                <Link href={`/parcels/${parcel.id}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{parcel.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{parcel.type.toLowerCase()}</p>
                      <p className="text-sm text-gray-500">
                        {parcel.width}m × {parcel.height}m ({((parcel.width * parcel.height) / 10000).toFixed(2)} ha)
                      </p>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-xs">
                        {parcel.latitude.toFixed(4)}, {parcel.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddParcelDialog open={showAddDialog} onOpenChange={setShowAddDialog} selectedLocation={selectedLocation} />
    </div>
  )
}
