"use client"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface SubstanceData {
  name: string
  monthlyData: number[]
  totalUsed: number
  maxDosage: number
}

interface SubstanceChartProps {
  data: SubstanceData[]
}

export function SubstanceChart({ data }: SubstanceChartProps) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const colors = [
    "rgb(34, 197, 94)",
    "rgb(59, 130, 246)",
    "rgb(239, 68, 68)",
    "rgb(245, 158, 11)",
    "rgb(168, 85, 247)",
    "rgb(236, 72, 153)",
  ]

  const chartData = {
    labels: months,
    datasets: data.map((substance, index) => ({
      label: substance.name,
      data: substance.monthlyData,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + "20",
      tension: 0.1,
    })),
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Monthly Substance Usage (kg/ha)",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No treatment data available for this year</div>
  }

  return <Line data={chartData} options={options} />
}
