"use client";

import { UserProfile } from "@clerk/nextjs";
import { useSetPageMetadata } from "@/contexts/page-metadata";

export default function ProfilePage() {
  useSetPageMetadata({
    title: "Configurações de Perfil",
    description: "Gerencie suas informações pessoais e preferências",
    breadcrumbs: [
      { label: "Início", href: "/dashboard" },
      { label: "Perfil" }
    ]
  });

  return (
    <div className="space-y-6">
      <UserProfile 
        path="/profile"
        routing="path"
      />
    </div>
  );
}