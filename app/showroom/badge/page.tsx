"use client";

import { PageBackground } from "@/components/ui/page-background";
import { ProCard } from "@/components/ui/pro-card";
import { BadgeCustom } from "@/components/ui/badge-custom"; // Asumiendo esta ruta para tu BadgeCustom
import type { BadgeVariant } from "@/lib/theme/components/badge-tokens";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/app/theme-provider";

const badgeVariants: BadgeVariant[] = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "success",
  "warning",
  "info",
  "neutral",
];

export default function BadgeShowroomPage() {
  const { mode } = useTheme();

  const renderBadgeSet = (isSubtle: boolean, isBordered?: boolean) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
      {badgeVariants.map((variant) => (
        <div
          key={`${variant}-${isSubtle ? "subtle" : "normal"}-${
            isBordered ? "bordered" : "unbordered"
          }`}
        >
          <BadgeCustom
            variant={variant}
            subtle={isSubtle}
            bordered={isBordered}
          >
            {variant}
            {isSubtle ? " subtle" : ""}
            {isBordered ? " bordered" : ""}
          </BadgeCustom>
        </div>
      ))}
    </div>
  );

  return (
    <PageBackground>
      <div className="container mx-auto py-10 px-4">
        <Text variant="heading" as="h1" className="mb-8 text-center">
          Badge Showroom
        </Text>

        <ProCard
          title={`Badges Normales (Modo: ${mode})`}
         
          className="mb-8"
        >
          {renderBadgeSet(false)}
        </ProCard>

        <ProCard
          title={`Badges Normales con Borde (Modo: ${mode})`}
         
          className="mb-8"
        >
          {renderBadgeSet(false, true)}
        </ProCard>

        <ProCard
          title={`Badges Sutiles (Modo: ${mode})`}
        
          className="mb-8"
        >
          {renderBadgeSet(true)}
        </ProCard>

        <ProCard
          title={`Badges Sutiles con Borde (Modo: ${mode})`}
          
          className="mb-8"
        >
          {renderBadgeSet(true, true)}
        </ProCard>
      </div>
    </PageBackground>
  );
}
