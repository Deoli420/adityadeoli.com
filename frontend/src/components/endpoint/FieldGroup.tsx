import type React from "react";

interface FieldGroupProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}

export function FieldGroup({ label, htmlFor, children, required }: FieldGroupProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium text-text-secondary"
      >
        {label}
        {required && <span className="text-risk-critical ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
