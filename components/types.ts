import { Prisma } from '@prisma/client'



export type SubstanceData = {
    name: string
    totalUsed: number
    maxDosage: number
    monthlyData: number[]
    applications: Array<{
      date: Date
      dose: number
      parcel: string
    }>
  }


export type ParcelWithTreatments = Prisma.ParcelGetPayload<{
    include: {
      treatments: {
        include: {
          productApplications: {
            include: {
              product: {
                include: {
                  composition: {
                    include: {
                      substance: true
                    }
                  }
                }
              }
            }
          },
          parcel: true
        }
      }
    }
  }>