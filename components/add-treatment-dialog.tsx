'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Disease, Product } from '@prisma/client'
import { Plus, X } from "lucide-react"

const formSchema = z.object({
  diseases: z.array(z.object({
    diseaseId: z.string().min(1, "Disease is required"),
  })).min(1, "At least one disease is required"),
  type: z.string().min(1, "Type is required"),
  dateMin: z.date(),
  dateMax: z.date(),
  waterDose: z.number().min(0),
  productApplications: z.array(z.object({
    productId: z.string(),
    dose: z.number().min(0),
  })).min(1, "At least one product is required"),
})

interface AddTreatmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parcelId: string
  diseases: Pick<Disease, 'id' | 'name'>[]
  products: Pick<Product, 'id' | 'name'>[]
}

export function AddTreatmentDialog({ open, onOpenChange, parcelId, diseases, products }: AddTreatmentDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      diseases: [{ diseaseId: "" }],
      type: "",
      waterDose: 0,
      productApplications: [{ productId: "", dose: 0 }],
    },
  })

  const { fields: diseaseFields, append: appendDisease, remove: removeDisease } = useFieldArray({
    control: form.control,
    name: "diseases",
  })

  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
    control: form.control,
    name: "productApplications",
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)
      const response = await fetch('/api/treatments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          parcelId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create treatment')
      }

      router.refresh()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error creating treatment:', error)
    } finally {
      setLoading(false)
    }
  }

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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                <FormLabel>Products</FormLabel>
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
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
                            placeholder="Dose"
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
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
                  <FormLabel>Water Dose (L/ha)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Treatment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 