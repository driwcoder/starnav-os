import { Card, CardContent, CardHeader } from "./ui/card";

// Skeleton para a tela de edição de OS
export function EditServiceOrderSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto animate-pulse">
        <CardHeader>
          <div className="h-8 w-2/3 bg-muted rounded mb-2 mx-auto" />
          <div className="h-4 w-1/3 bg-muted rounded mx-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-1/4 bg-muted rounded" />
                <div className="h-10 w-full bg-muted rounded" />
              </div>
            ))}
            <div className="h-4 w-1/4 bg-muted rounded mt-6" />
            <div className="h-10 w-full bg-muted rounded" />
            <div className="h-4 w-1/4 bg-muted rounded mt-6" />
            <div className="h-10 w-full bg-muted rounded" />
            <div className="h-4 w-1/4 bg-muted rounded mt-6" />
            <div className="h-10 w-full bg-muted rounded" />
            <div className="h-4 w-1/4 bg-muted rounded mt-6" />
            <div className="h-10 w-full bg-muted rounded" />
            <div className="flex gap-4 mt-8">
              <div className="h-10 w-1/2 bg-muted rounded" />
              <div className="h-10 w-1/2 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



// Skeleton para detalhes da Ordem de Serviço
export function ServiceOrderDetailsSkeleton() {
  return (
    <div className="container mx-auto py-8 max-w-7xl animate-pulse">
      <div className="mb-8 text-center">
        <div className="h-10 w-1/2 bg-muted rounded mx-auto mb-2" />
        <div className="h-5 w-1/4 bg-muted rounded mx-auto" />
      </div>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[...Array(2)].map((_, i) => (
          <div key={i}>
            <div className="h-6 w-1/3 bg-muted rounded mb-4" />
            <div className="space-y-3">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-4 w-full bg-muted rounded" />
              ))}
            </div>
          </div>
        ))}
      </section>
      <div className="my-8 h-4 w-full bg-muted rounded" />
      {[...Array(3)].map((_, i) => (
        <section key={i} className="mb-8">
          <div className="h-6 w-1/3 bg-muted rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-4 w-full bg-muted rounded" />
            ))}
          </div>
        </section>
      ))}
      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-10">
        <div className="h-10 w-32 bg-muted rounded" />
        <div className="h-10 w-40 bg-muted rounded" />
      </div>
    </div>
  );
}

// Skeleton para a lista de ordens de serviço
export function ServiceOrdersListSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-1/3 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="mb-6 rounded-md border p-4 bg-white shadow-sm">
        <div className="h-10 w-full bg-muted rounded mb-4 animate-pulse" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-40 bg-muted rounded animate-pulse" />
          ))}
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {["ID", "Título", "Navio", "Status", "Prioridade", "Solicitado Por", "Prazo", "Ações"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <tr key={i} className="bg-white">
                {[...Array(8)].map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}