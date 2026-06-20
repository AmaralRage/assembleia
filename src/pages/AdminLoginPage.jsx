import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Loader2, LockKeyhole, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { recognizeAdminDevice } from "@/lib/adminDevice";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const checkCurrentSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data } = await supabase.rpc("is_calendar_admin");

        if (data === true) {
          recognizeAdminDevice();
          navigate("/calendario", { replace: true });
          return;
        }

        await supabase.auth.signOut();
      }

      setIsCheckingSession(false);
    };

    checkCurrentSession();
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsAuthenticating(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (error) {
      setIsAuthenticating(false);
      toast.error("Não foi possível entrar com essas credenciais.");
      return;
    }

    const { data: hasAdminAccess, error: accessError } = await supabase.rpc(
      "is_calendar_admin",
    );

    if (accessError || hasAdminAccess !== true) {
      await supabase.auth.signOut();
      setIsAuthenticating(false);
      setCredentials((current) => ({ ...current, password: "" }));
      toast.error("Esta conta não possui acesso administrativo.");
      return;
    }

    recognizeAdminDevice();
    toast.success("Acesso administrativo liberado.");
    navigate("/calendario", { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Acesso administrativo - Assembleia de Deus da Lapa</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />
      <Toaster position="top-right" />

      <main className="min-h-screen bg-muted px-4 pb-20 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-md rounded-3xl border border-border bg-background p-7 shadow-xl md:p-9"
        >
          {isCheckingSession ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <LockKeyhole className="h-7 w-7 text-primary" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Acesso restrito
              </p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">
                Área administrativa
              </h1>
              <p className="mt-2 text-muted-foreground">
                Entre com a conta autorizada para gerenciar a agenda.
              </p>

              <form onSubmit={handleLogin} className="mt-7 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground">
                    Login
                  </label>
                  <Input
                    type="text"
                    name="admin-login"
                    autoComplete="off"
                    value={credentials.email}
                    onChange={(event) =>
                      setCredentials({
                        ...credentials,
                        email: event.target.value,
                      })
                    }
                    className="mt-1.5"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground">
                    Senha
                  </label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={credentials.password}
                    onChange={(event) =>
                      setCredentials({
                        ...credentials,
                        password: event.target.value,
                      })
                    }
                    className="mt-1.5"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full rounded-xl"
                >
                  {isAuthenticating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Entrar
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </>
  );
};

export default AdminLoginPage;
