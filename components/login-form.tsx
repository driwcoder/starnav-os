import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      
      console.error("Authentication error:", result.error);
    } else if (result?.ok) {
      router.push("/dashboard");
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bem-vindo</CardTitle>
          <CardDescription>Login com seu e-mail da empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.nome@starnav.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Esqueceu sua senha?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </div>
              <div className="text-center text-sm">
                Não tem uma conta?{" "}
                <a href="#" className="underline underline-offset-4">
                  Solicite ao TI
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
