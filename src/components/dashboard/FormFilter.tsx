import { Filter } from "lucide-react";

export interface FormOption {
  configId: string;
  title: string;
  companyKey: string;
}

interface FormFilterProps {
  forms: FormOption[];
  selectedFormId: string;
  onChange: (formId: string) => void;
  className?: string;
}

export function FormFilter({ forms, selectedFormId, onChange, className = "" }: FormFilterProps) {
  if (forms.length <= 1) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <select
        value={selectedFormId}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm w-full sm:w-auto"
      >
        <option value="">Todos os formulários</option>
        {forms.map((f) => (
          <option key={f.configId} value={f.configId}>
            {f.title}
          </option>
        ))}
      </select>
    </div>
  );
}
