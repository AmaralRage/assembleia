import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    password: "",
    confirmation: "",
  });
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasRecoverySession(Boolean(session));
      setIsCheckingLink(false);
    };

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(true);
        setIsCheckingLink(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!passwords.password || !passwords.confirmation) {
      toast.error("Preencha e confirme a nova senha.");
      return;
    }

    if (passwords.password.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (passwords.password !== passwords.confirmation) {
      toast.error("As senhas informadas não são iguais.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: passwords.password,
    });
    setIsSaving(false);

    if (error) {
      toast.error("Não foi possível atualizar a senha. Solicite um novo link.");
      return;
    }

    await supabase.auth.signOut();
    setIsComplete(true);
    setPasswords({ password: "", confirmation: "" });
  };

  return (
    <>
      <Helmet>
        <title>Redefinir senha - Assembleia de Deus da Lapa</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />
      <main className="min-h-screen bg-muted px-4 pb-20 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-md rounded-3xl border border-border bg-background p-7 shadow-xl md:p-9"
        >
          {isCheckingLink ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isComplete ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
              <h1 className="mt-5 text-3xl font-bold text-foreground">
                Senha atualizada
              </h1>
              <p className="mt-3 text-muted-foreground">
                Sua nova senha já pode ser usada na área administrativa.
              </p>
              <Button
                type="button"
                onClick={() => navigate("/administracao", { replace: true })}
                className="mt-7 w-full rounded-xl"
              >
                Ir para o login
              </Button>
            </div>
          ) : hasRecoverySession ? (
            <>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Recuperação de acesso
              </p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">
                Crie uma nova senha
              </h1>
              <p className="mt-2 text-muted-foreground">
                Use pelo menos 8 caracteres e confirme a senha abaixo.
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-7 space-y-4"
              >
                <div>
                  <label className="text-sm font-semibold text-foreground">
                    Nova senha
                  </label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={passwords.password}
                    onChange={(event) =>
                      setPasswords({
                        ...passwords,
                        password: event.target.value,
                      })
                    }
                    className="mt-1.5"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground">
                    Confirmar nova senha
                  </label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={passwords.confirmation}
                    onChange={(event) =>
                      setPasswords({
                        ...passwords,
                        confirmation: event.target.value,
                      })
                    }
                    className="mt-1.5"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded-xl"
                >
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar nova senha
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <KeyRound className="mx-auto h-14 w-14 text-muted-foreground" />
              <h1 className="mt-5 text-3xl font-bold text-foreground">
                Link inválido ou expirado
              </h1>
              <p className="mt-3 text-muted-foreground">
                Solicite um novo link de recuperação na área administrativa.
              </p>
              <Button
                type="button"
                onClick={() => navigate("/administracao", { replace: true })}
                className="mt-7 w-full rounded-xl"
              >
                Voltar
              </Button>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </>
  );
};

export default ResetPasswordPage;
