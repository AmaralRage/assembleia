import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header.jsx";
import Seo from "@/components/Seo.jsx";
import Footer from "@/components/Footer.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  forgetAdminDevice,
  isAdminSessionFresh,
  startAdminSessionTimer,
} from "@/lib/adminDevice";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [recoveryLogin, setRecoveryLogin] = useState("");
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  useEffect(() => {
    const checkCurrentSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && isAdminSessionFresh()) {
        const { data } = await supabase.rpc("is_calendar_admin");

        if (data === true) {
          navigate("/calendario", { replace: true });
          return;
        }
      }

      if (session) {
        await supabase.auth.signOut();
        forgetAdminDevice();
      }

      setIsCheckingSession(false);
    };

    checkCurrentSession();
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!credentials.email.trim() || !credentials.password) {
      toast.error("Preencha o login e a senha.");
      return;
    }

    setIsAuthenticating(true);
    startAdminSessionTimer();

    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (error) {
      forgetAdminDevice();
      setIsAuthenticating(false);
      toast.error("Não foi possível entrar com essas credenciais.");
      return;
    }

    const { data: hasAdminAccess, error: accessError } = await supabase.rpc(
      "is_calendar_admin",
    );

    if (accessError || hasAdminAccess !== true) {
      await supabase.auth.signOut();
      forgetAdminDevice();
      setIsAuthenticating(false);
      setCredentials((current) => ({ ...current, password: "" }));
      toast.error("Esta conta não possui acesso administrativo.");
      return;
    }

    startAdminSessionTimer();
    toast.success("Acesso administrativo liberado.");
    navigate("/calendario", { replace: true });
  };

  const handlePasswordRecovery = async (event) => {
    event.preventDefault();

    if (!recoveryLogin.trim()) {
      toast.error("Informe seu login.");
      return;
    }

    setIsSendingRecovery(true);

    await supabase.auth.resetPasswordForEmail(recoveryLogin.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setIsSendingRecovery(false);
    setRecoveryLogin("");
    toast.success(
      "Se o login estiver cadastrado, enviaremos as instruções de recuperação.",
    );
  };

  return (
    <>
      <Seo
        title="Acesso administrativo - Assembleia de Deus na Lapa"
        description="Área restrita para administração do calendário da Assembleia de Deus na Lapa."
        noIndex
        noFollow
      />

      <Header />
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

              {showPasswordRecovery ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Recuperação de acesso
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-foreground">
                    Esqueci minha senha
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Informe seu login para receber um link de recuperação.
                  </p>

                  <form
                    onSubmit={handlePasswordRecovery}
                    noValidate
                    className="mt-7 space-y-4"
                  >
                    <div>
                      <label className="text-sm font-semibold text-foreground">
                        Login
                      </label>
                      <Input
                        type="text"
                        name="recovery-login"
                        autoComplete="off"
                        value={recoveryLogin}
                        onChange={(event) => setRecoveryLogin(event.target.value)}
                        className="mt-1.5"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSendingRecovery}
                      className="w-full rounded-xl"
                    >
                      {isSendingRecovery ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Enviar instruções
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowPasswordRecovery(false)}
                      className="flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar para o login
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Acesso restrito
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-foreground">
                    Área administrativa
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Entre com a conta autorizada para gerenciar a agenda.
                  </p>

                  <form
                    onSubmit={handleLogin}
                    noValidate
                    className="mt-7 space-y-4"
                  >
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
                      <div className="relative mt-1.5">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={credentials.password}
                          onChange={(event) =>
                            setCredentials({
                              ...credentials,
                              password: event.target.value,
                            })
                          }
                          className="pr-11"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          aria-label={
                            showPassword ? "Ocultar senha" : "Mostrar senha"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
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

                    <button
                      type="button"
                      onClick={() => setShowPasswordRecovery(true)}
                      className="w-full text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      Esqueci minha senha
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </>
  );
};

export default AdminLoginPage;
