"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

type TabsContextType = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children?: React.ReactNode;
};

export function Tabs({ value, defaultValue, onValueChange, className = "", children }: TabsProps) {
  const [internal, setInternal] = useState<string>(defaultValue || "");
  const current = value !== undefined ? value : internal;

  const setValue = (v: string) => {
    if (onValueChange) onValueChange(v);
    if (value === undefined) setInternal(v);
  };

  const ctx = useMemo(() => ({ value: current, setValue }), [current]);

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`inline-grid gap-2 ${className}`}>{children}</div>;
}

export function TabsTrigger({ value, children, className = "" }: { value: string; children?: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  const active = ctx.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-accent"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }: { value: string; children?: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}

export default Tabs;
