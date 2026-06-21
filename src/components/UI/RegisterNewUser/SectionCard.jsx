import React from "react";

export const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-card rounded-2xl border border-border p-6 space-y-5 shadow-sm">
    <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
      {Icon && <Icon className="text-primary" size={20} />}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);
