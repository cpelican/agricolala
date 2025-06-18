import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AuthGuard } from "@/components/auth-guard"
import { BottomNavigation } from "@/components/bottom-navigation"
import { HomeContent } from "@/components/home-content"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const parcels = await prisma.parcel.findMany({
    where: { userId: session.user.id },
    include: {
      treatments: {
        include: {
          productApplications: {
            include: {
              product: {
                include: {
                  composition: {
                    include: {
                      substance: true,
                    },
                  },
                },
              },
            },
          },
          parcel: true,
        },
        where: {
          status: "DONE",
          appliedDate: {
            gte: new Date(new Date().getFullYear(), 0, 1),
            lte: new Date(new Date().getFullYear(), 11, 31),
          },
        },
      },
    },
  })

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-green-600 text-white p-4">
          <h1 className="text-2xl font-bold">Agraria</h1>
          <p className="text-green-100">Welcome back, {session.user.name}</p>
        </div>

        <HomeContent parcels={parcels} />
        <BottomNavigation />
      </div>
    </AuthGuard>
  )
}
