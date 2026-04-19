import { GraduationCap } from "lucide-react";

export function SchoolLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-9 w-9 rounded-lg gradient-hero flex items-center justify-center shadow-soft">
        <GraduationCap className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="leading-tight">
        <div className="font-display font-bold text-base">Double Vision</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">High School</div>
      </div>
    </div>
  );
}
