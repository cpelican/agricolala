"use client"

import { useEffect, useRef } from "react"

interface Parcel {
  id: string
  name: string
  latitude: number
  longitude: number
}

interface ParcelMapProps {
  parcels: Parcel[]
  onMapClick?: (lat: number, lng: number) => void
}

export function ParcelMap({ parcels, onMapClick }: ParcelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Simple map implementation using a placeholder
    // In a real app, you'd use Leaflet, Google Maps, or similar
    const initMap = () => {
      if (!mapRef.current) return

      // Create a simple interactive map placeholder
      const mapElement = mapRef.current
      mapElement.innerHTML = ""

      const canvas = document.createElement("canvas")
      canvas.width = mapElement.offsetWidth
      canvas.height = 300
      canvas.style.width = "100%"
      canvas.style.height = "300px"
      canvas.style.border = "1px solid #e5e7eb"
      canvas.style.borderRadius = "8px"
      canvas.style.cursor = "crosshair"

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Draw a simple map background
      ctx.fillStyle = "#f3f4f6"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      // Draw parcels as pins
      parcels.forEach((parcel, index) => {
        const x = (index + 1) * (canvas.width / (parcels.length + 1))
        const y = 100 + Math.random() * 100

        // Draw pin
        ctx.fillStyle = "#16a34a"
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, 2 * Math.PI)
        ctx.fill()

        // Draw label
        ctx.fillStyle = "#000"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(parcel.name, x, y + 25)
      })

      // Add click handler
      canvas.addEventListener("click", (e) => {
        if (onMapClick) {
          const rect = canvas.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top

          // Convert to mock coordinates
          const lat = 45.0 + (y / canvas.height) * 0.1
          const lng = 7.0 + (x / canvas.width) * 0.1

          onMapClick(lat, lng)
        }
      })

      mapElement.appendChild(canvas)
    }

    initMap()
  }, [parcels, onMapClick])

  return (
    <div className="w-full">
      <div ref={mapRef} className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">Click on the map to add a new parcel at that location</p>
    </div>
  )
}
