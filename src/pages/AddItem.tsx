import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Link, Navigate, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/data/products";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { uploadProductImage, createProduct } from "@/hooks/useProducts";

const AddItemContent = () => {
  const { isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    category: categoryId || "",
    description: "",
    badge: "",
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAddProduct = isAdmin || isSuperAdmin;

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect non-admins
  if (!canAddProduct) {
    return <Navigate to="/" replace />;
  }

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
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      toast.error("Please select a product image");
      return;
    }

    if (!formData.name || !formData.price || !formData.category || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image first
      const imageUrl = await uploadProductImage(imageFile);

      // Get category name from ID
      const categoryMap: Record<string, string> = {
        "anime-world": "Anime World",
        "accessories": "Accessories",
        "electronics": "Electronics",
        "cloths": "Cloths",
      };
      
      const categoryName = categoryMap[formData.category] || formData.category;

      // Create product
      await createProduct({
        name: formData.name,
        price: Math.round(parseFloat(formData.price)),
        originalPrice: formData.originalPrice 
          ? Math.round(parseFloat(formData.originalPrice)) 
          : undefined,
        imageUrl,
        category: categoryName,
        description: formData.description,
        badge: formData.badge || undefined,
      });

      toast.success("Product added successfully!");
      
      // Navigate to the category page or shop
      if (formData.category) {
        navigate(`/category/${formData.category}`);
      } else {
        navigate("/shop");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartSidebar />
      
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Back Button */}
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            <span>Back to Shop</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-heading font-semibold mb-2">
              Add New Product
            </h1>
            <p className="text-muted-foreground mb-8">
              List a new product in your store
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <Label>Product Image *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-48 h-48 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={handleBrowseClick}
                    className="mt-2 border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to browse and select an image
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WebP up to 5MB
                    </p>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                  className="mt-1"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (PKR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">Original Price (optional)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Badge */}
              <div>
                <Label htmlFor="badge">Badge (optional)</Label>
                <Select
                  value={formData.badge}
                  onValueChange={(value) => setFormData({ ...formData, badge: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a badge (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Sale">Sale</SelectItem>
                    <SelectItem value="Bestseller">Bestseller</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your product..."
                  rows={4}
                  required
                  className="mt-1"
                />
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                size="lg" 
                className="w-full gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Adding Product...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Add Product
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

const AddItem = () => {
  return (
    <CartProvider>
      <AddItemContent />
    </CartProvider>
  );
};

export default AddItem;
