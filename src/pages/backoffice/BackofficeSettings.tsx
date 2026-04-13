import { BackofficeLayout } from "@/components/backoffice/BackofficeLayout";

export default function BackofficeSettings() {
  return (
    <BackofficeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-sm text-slate-400 mt-1">Configurações gerais do backoffice</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
          Em breve — configurações avançadas da plataforma.
        </div>
      </div>
    </BackofficeLayout>
  );
}
