import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "user" | "admin" | "superadmin" | "moderator" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: UserRole;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const checkRoleStatus = async (userId: string) => {
    try {
      // Get user's highest role
      const { data: roleData, error: roleError } = await supabase.rpc("get_user_role", {
        _user_id: userId
      });

      if (roleError) {
        console.error("Error getting user role:", roleError);
        setUserRole("user");
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }

      const role = roleData as UserRole;
      setUserRole(role || "user");

      // Check admin status
      const { data: adminData } = await supabase.rpc("is_admin_or_superadmin", {
        _user_id: userId
      });
      setIsAdmin(adminData === true);

      // Check superadmin status
      const { data: superData } = await supabase.rpc("is_superadmin", {
        _user_id: userId
      });
      setIsSuperAdmin(superData === true);
    } catch (error) {
      console.error("Error checking role status:", error);
      setUserRole("user");
      setIsAdmin(false);
      setIsSuperAdmin(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Defer role check to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkRoleStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        checkRoleStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isSuperAdmin, userRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
