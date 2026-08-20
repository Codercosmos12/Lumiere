import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/UserManagement";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { SystemLogs } from "@/components/admin/SystemLogs";
import { motion } from "framer-motion";
import { Shield, Users, Package, Activity } from "lucide-react";


const AdminContent = () => {
  const { isAdmin, isSuperAdmin, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartSidebar />
      
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-heading font-semibold">
                Admin Panel
              </h1>
            </div>
            <p className="text-muted-foreground mb-8">
              {isSuperAdmin ? "Super Admin Access" : "Admin Access"} • Role: {userRole}
            </p>

            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="orders" className="gap-2">
                  <Package size={16} />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="monitoring" className="gap-2">
                  <Activity size={16} />
                  Monitoring
                </TabsTrigger>
                {isSuperAdmin && (
                  <TabsTrigger value="users" className="gap-2">
                    <Users size={16} />
                    Users & Roles
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="orders">
                <OrderManagement />
              </TabsContent>

              <TabsContent value="monitoring">
                <SystemLogs />
              </TabsContent>
              
              {isSuperAdmin && (
                <TabsContent value="users">
                  <UserManagement />
                </TabsContent>
              )}
            </Tabs>

          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

const Admin = () => {
  return (
    <CartProvider>
      <AdminContent />
    </CartProvider>
  );
};

export default Admin;
