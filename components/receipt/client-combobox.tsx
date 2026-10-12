"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, Plus } from "lucide-react";
import type { MockClient } from "@/lib/mock";

type Props = {
  clients: MockClient[];
  value: string;
  onChange: (value: string, newName?: string) => void;
};

export function ClientCombobox({ clients, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );
  
  const selectedName = value === "NEW" ? "— New Client —" : (value ? clients.find(c => c.id === value)?.name : "— Walk-in customer —");

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-left text-base ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:h-10 md:text-sm"
      >
        <span className="truncate">{selectedName || "— Walk-in customer —"}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background text-popover-foreground shadow-md">
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="p-1">
            <div
              className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-muted hover:text-accent-foreground ${!value ? "font-medium" : ""}`}
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
            >
              {!value && <Check className="absolute left-2 h-4 w-4" />}
              — Walk-in customer —
            </div>
            {filtered.map(c => (
              <div
                key={c.id}
                className={`relative flex w-full cursor-pointer select-none flex-col items-start justify-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-muted hover:text-accent-foreground ${value === c.id ? "font-medium" : ""}`}
                onClick={() => { onChange(c.id); setOpen(false); setSearch(""); }}
              >
                {value === c.id && <Check className="absolute left-2 top-2 h-4 w-4" />}
                <span>{c.name}</span>
                {c.email && <span className="text-xs text-muted-foreground font-normal">{c.email}</span>}
              </div>
            ))}
            
            {/* Create new client option */}
            {search.trim() !== "" && !clients.some(c => c.name.toLowerCase() === search.trim().toLowerCase()) && (
              <div
                className="relative mt-1 flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm font-medium text-primary outline-none transition-colors hover:bg-primary/10 hover:text-primary"
                onClick={() => { onChange("NEW", search.trim()); setOpen(false); setSearch(""); }}
              >
                <Plus className="absolute left-2 h-4 w-4" />
                Create new client: &quot;{search.trim()}&quot;
              </div>
            )}

            {filtered.length === 0 && search.trim() === "" && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No clients found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
