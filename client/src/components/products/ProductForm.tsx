import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IProduct, CreateProductPayload } from "@/types/product";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(500),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  brand: z.string().max(200).optional(),
  price: z.number().positive("Must be a positive number").optional(),
  currency: z.string().length(3, "Must be 3 characters"),
  targetAudience: z.string().max(500).optional(),
  features: z.array(z.object({ value: z.string() })),
  benefits: z.array(z.object({ value: z.string() })),
  tags: z.array(z.object({ value: z.string() })),
});

type ProductFormValues = z.infer<typeof productSchema>;

function toFieldArray(arr?: string[]): { value: string }[] {
  return (arr ?? []).map((v) => ({ value: v }));
}

interface ProductFormProps {
  initialData?: Partial<IProduct>;
  onSubmit: (payload: CreateProductPayload) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ProductForm({
  initialData,
  onSubmit,
  isLoading,
  submitLabel = "Save",
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      category: initialData?.category ?? "",
      subcategory: initialData?.subcategory ?? "",
      brand: initialData?.brand ?? "",
      price: initialData?.price,
      currency: initialData?.currency ?? "USD",
      targetAudience: initialData?.targetAudience ?? "",
      features: toFieldArray(initialData?.features),
      benefits: toFieldArray(initialData?.benefits),
      tags: toFieldArray(initialData?.tags),
    },
  });

  const featuresArr = useFieldArray({ control, name: "features" });
  const benefitsArr = useFieldArray({ control, name: "benefits" });
  const tagsArr = useFieldArray({ control, name: "tags" });

  const submit = async (values: ProductFormValues) => {
    await onSubmit({
      name: values.name,
      category: values.category || undefined,
      subcategory: values.subcategory || undefined,
      brand: values.brand || undefined,
      price: values.price,
      currency: values.currency,
      targetAudience: values.targetAudience || undefined,
      features: values.features.map((f) => f.value).filter(Boolean),
      benefits: values.benefits.map((b) => b.value).filter(Boolean),
      tags: values.tags.map((t) => t.value).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Product name *</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Category + Subcategory */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...register("category")} placeholder="e.g. Electronics" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Input id="subcategory" {...register("subcategory")} placeholder="e.g. Headphones" />
        </div>
      </div>

      {/* Brand + Target Audience */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" {...register("brand")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetAudience">Target audience</Label>
          <Input id="targetAudience" {...register("targetAudience")} placeholder="e.g. Parents, Gamers" />
        </div>
      </div>

      {/* Price + Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            {...register("price", {
              setValueAs: (v: string) =>
                v === "" || v == null ? undefined : parseFloat(v),
            })}
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" {...register("currency")} maxLength={3} />
          {errors.currency && (
            <p className="text-xs text-destructive">{errors.currency.message}</p>
          )}
        </div>
      </div>

      {/* Features */}
      <FieldList
        label="Features"
        placeholder="e.g. Noise cancelling"
        fields={featuresArr.fields}
        onAdd={() => featuresArr.append({ value: "" })}
        onRemove={featuresArr.remove}
        register={register}
        fieldName="features"
      />

      {/* Benefits */}
      <FieldList
        label="Benefits"
        placeholder="e.g. Reduces stress"
        fields={benefitsArr.fields}
        onAdd={() => benefitsArr.append({ value: "" })}
        onRemove={benefitsArr.remove}
        register={register}
        fieldName="benefits"
      />

      {/* Tags */}
      <FieldList
        label="Tags"
        placeholder="e.g. wireless"
        fields={tagsArr.fields}
        onAdd={() => tagsArr.append({ value: "" })}
        onRemove={tagsArr.remove}
        register={register}
        fieldName="tags"
      />

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

// Reusable dynamic list field
interface FieldListProps {
  label: string;
  placeholder?: string;
  fields: { id: string }[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  register: ReturnType<typeof useForm<ProductFormValues>>["register"];
  fieldName: "features" | "benefits" | "tags";
}

function FieldList({
  label,
  placeholder,
  fields,
  onAdd,
  onRemove,
  register,
  fieldName,
}: FieldListProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="ghost" size="xs" onClick={onAdd}>
          + Add
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">None added.</p>
      )}
      <div className="space-y-1.5">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <Input
              {...register(`${fieldName}.${index}.value` as const)}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemove(index)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
