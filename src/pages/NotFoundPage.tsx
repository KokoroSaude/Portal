import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Compass className="size-5 text-primary/70" aria-hidden />
            <CardTitle className="font-serif text-2xl">Página não encontrada</CardTitle>
          </div>
          <CardDescription>
            O endereço acessado não existe ou foi movido. Verifique o link ou volte para o início.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 size-4" />
              Voltar ao início
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
