"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("articulos.groupsPageClient");
  const [visibilityFilter, setVisibilityFilter] = React.useState<VisibilityFilter>("all");

  const hasGroups = initialGroups && initialGroups.length > 0;

  return (
    <div className="p-4 sm:p-6">
      <StandardPageTitle
        title={t("pageTitle")}
        subtitle={t("activeProjectSubtitle", { name: projectName })}
        showBackButton={{ href: "/articulos", label: t("backButtonLabel") }}
        actions={
          <div className="flex items-center gap-2">
            <StandardSelect
              id="visibility-filter"
              options={[
                { value: "all", label: t("filterAll") },
                { value: "public", label: t("filterPublic") },
                { value: "private", label: t("filterPrivate") },
              ]}
              value={visibilityFilter}
              onChange={(v) => setVisibilityFilter((v as VisibilityFilter) ?? "all")}
            />
          </div>
        }
      />

      {!hasGroups ? (
        <StandardEmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <div className="mt-2">
          <GroupsManagerClient initialGroups={initialGroups} visibilityFilter={visibilityFilter} focusGroupId={focusGroupId} />
        </div>
      )}
    </div>
  );
}
