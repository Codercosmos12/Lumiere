import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/data/products";
import { Product } from "@/types/product";
import { updateProduct, uploadProductImage } from "@/hooks/useProducts";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";

interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

export const EditProductDialog = ({ product, open, onOpenChange, onProductUpdated }: EditProductDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryReverseMap: Record<string, string> = {
    "Anime World": "anime-world",
    "Accessories": "accessories",
    "Electronics": "electronics",
    "Cloths": "cloths",
  };

  const [formData, setFormData] = useState({
    name: product.name,
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : "",
    category: categoryReverseMap[product.category] || product.category,
    description: product.description,
    badge: product.badge || "none",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const categoryMap: Record<string, string> = {
        "anime-world": "Anime World",
        "accessories": "Accessories",
        "electronics": "Electronics",
        "cloths": "Cloths",
      };

      await updateProduct(product.id, {
        name: formData.name,
        price: Math.round(parseFloat(formData.price)),
        originalPrice: formData.originalPrice ? Math.round(parseFloat(formData.originalPrice)) : null,
        imageUrl,
        category: categoryMap[formData.category] || formData.category,
        description: formData.description,
        badge: formData.badge === "none" ? null : formData.badge,
      });

      toast.success("Product updated successfully!");
      onProductUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image */}
          <div>
            <Label>Product Image</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <div className="flex items-center gap-3 mt-1">
              <img
                src={imagePreview || product.image}
                alt="Preview"
                className="w-16 h-16 object-cover rounded border"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus size={14} className="mr-1" /> Change Image
              </Button>
              {imageFile && (
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                  <X size={16} className="text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="edit-name">Name *</Label>
            <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1" />
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-price">Price (PKR) *</Label>
              <Input id="edit-price" type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-original-price">Original Price</Label>
              <Input id="edit-original-price" type="number" min="0" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Badge</Label>
            <Select value={formData.badge} onValueChange={(v) => setFormData({ ...formData, badge: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Sale">Sale</SelectItem>
                <SelectItem value="Bestseller">Bestseller</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} required className="mt-1" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-1" /> Saving...</> : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
