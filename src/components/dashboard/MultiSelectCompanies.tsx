import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
}

interface MultiSelectCompaniesProps {
  companies: Company[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelectCompanies({ companies, selected, onChange, placeholder = "Todas as empresas" }: MultiSelectCompaniesProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const selectedNames = companies.filter(c => selected.includes(c.id)).map(c => c.name);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm min-w-[200px] transition-colors",
          "hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          open && "ring-2 ring-ring ring-offset-1"
        )}
      >
        <span className="flex-1 text-left truncate">
          {selected.length === 0
            ? <span className="text-muted-foreground">{placeholder}</span>
            : selectedNames.length <= 2
              ? selectedNames.join(", ")
              : `${selectedNames.length} selecionadas`
          }
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg z-50 max-h-60 overflow-y-auto">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-muted transition-colors border-b border-border"
            >
              <X className="h-3 w-3" /> Limpar seleção
            </button>
          )}
          {companies.map(c => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
            >
              <div className={cn(
                "h-4 w-4 rounded border border-border flex items-center justify-center transition-colors shrink-0",
                selected.includes(c.id) && "bg-primary border-primary"
              )}>
                {selected.includes(c.id) && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <span className="truncate text-foreground">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
