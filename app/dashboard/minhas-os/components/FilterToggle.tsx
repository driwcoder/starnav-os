// app/dashboard/minhas-os/components/FilterToggle.tsx
"use client";

import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function FilterToggle({ historico }: { historico: boolean }) {
  const router = useRouter();

  const toggle = () => {
    const newSearch = new URLSearchParams();
    newSearch.set("historico", (!historico).toString());
    router.replace(`/dashboard/minhas-os?${newSearch.toString()}`);
  };

  return (
    <div className="flex items-center space-x-4">
      <Switch id="historico" checked={historico} onCheckedChange={toggle} />
      <Label htmlFor="historico">
        {historico ? "Exibindo Concluídas" : "OSs à Tratar"}
      </Label>
    </div>
  );
}
