"use client";

import * as React from "react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import type { GroupForClient } from "./page";
import GroupsManagerClient from "./GroupsManagerClient";

type VisibilityFilter = "all" | "public" | "private";

type GroupsPageClientProps = {
  initialGroups: GroupForClient[];
  projectName: string;
  focusGroupId?: string;
};

export default function GroupsPageClient({ initialGroups, projectName, focusGroupId }: GroupsPageClientProps) {
  const [visibilityFilter, setVisibilityFilter] = React.useState<VisibilityFilter>("all");

  const hasGroups = initialGroups && initialGroups.length > 0;

  return (
    <div className="p-4 sm:p-6">
      <StandardPageTitle
        title="Grupos de Artículos"
        subtitle={`Proyecto activo: ${projectName}`}
        showBackButton={{ href: "/articulos", label: "Volver" }}
        actions={
          <div className="flex items-center gap-2">
            <StandardSelect
              id="visibility-filter"
              options={[
                { value: "all", label: "Todos" },
                { value: "public", label: "Públicos" },
                { value: "private", label: "Privados" },
              ]}
              value={visibilityFilter}
              onChange={(v) => setVisibilityFilter((v as VisibilityFilter) ?? "all")}
            />
          </div>
        }
      />

      {!hasGroups ? (
        <StandardEmptyState
          title="Sin grupos"
          description="No hay grupos para este proyecto. Puedes crear uno desde otras vistas o pronto desde aquí."
        />
      ) : (
        <div className="mt-2">
          <GroupsManagerClient initialGroups={initialGroups} visibilityFilter={visibilityFilter} focusGroupId={focusGroupId} />
        </div>
      )}
    </div>
  );
}
