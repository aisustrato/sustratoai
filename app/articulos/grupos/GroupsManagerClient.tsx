"use client";

import * as React from "react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import type { GroupForClient, GroupItemForClient } from "./page";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { toast } from "sonner";
import { updateGroupDetails, removeArticleFromGroup } from "@/lib/actions/article-group-actions";
import type { Database } from "@/lib/database.types";
import { StandardTable } from "@/components/ui/StandardTable";
import type { ColumnDef } from "@tanstack/react-table";
import { StandardAccordion, StandardAccordionItem, StandardAccordionTrigger, StandardAccordionContent } from "@/components/ui/StandardAccordion";
import { StickyNote } from "lucide-react";
import GroupNoteEditor from "./GroupNoteEditor";
import { StandardSwitch } from "@/components/ui/StandardSwitch";

type VisibilityFilter = "all" | "public" | "private";

type GroupsManagerClientProps = {
  initialGroups: GroupForClient[];
  visibilityFilter?: VisibilityFilter;
  focusGroupId?: string;
};

export default function GroupsManagerClient({ initialGroups, visibilityFilter = "all", focusGroupId }: GroupsManagerClientProps) {
  const [groups, setGroups] = React.useState<GroupForClient[]>(initialGroups);
  const [editingGroup, setEditingGroup] = React.useState<GroupForClient | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formDesc, setFormDesc] = React.useState<string>("");
  const [formVisibility, setFormVisibility] = React.useState<Database["public"]["Enums"]["group_visibility"]>("private");
  const [isSaving, setIsSaving] = React.useState(false);
  // Estado para el editor de notas
  const [noteEditorOpen, setNoteEditorOpen] = React.useState(false);
  const [selectedArticleId, setSelectedArticleId] = React.useState<string | null>(null);
  const [selectedArticleTitle, setSelectedArticleTitle] = React.useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  // Estado de toggle por fila (clave: article_id)
  const [rowTranslated, setRowTranslated] = React.useState<Record<string, boolean>>({});

  const openEdit = React.useCallback((g: GroupForClient) => {
    setEditingGroup(g);
    setFormName(g.name ?? "");
    setFormDesc(g.description ?? "");
    setFormVisibility(g.visibility);
  }, []);

  const closeEdit = React.useCallback(() => {
    if (isSaving) return;
    setEditingGroup(null);
  }, [isSaving]);

  const handleSave = React.useCallback(async () => {
    if (!editingGroup) return;
    const nameTrimmed = formName.trim();
    const descTrimmed = formDesc.trim();
    if (!nameTrimmed) {
      toast.error("El nombre es requerido");
      return;
    }

    setIsSaving(true);
    const groupId = editingGroup.id;
    const prevGroups = groups;
    const optimistic = groups.map((g) =>
      g.id === groupId
        ? { ...g, name: nameTrimmed, description: descTrimmed || null, visibility: formVisibility }
        : g
    );
    setGroups(optimistic);

    try {
      const result = await updateGroupDetails({
        groupId,
        name: nameTrimmed,
        description: descTrimmed || undefined,
        visibility: formVisibility,
      });
      if (result.success) {
        toast.success("Grupo actualizado correctamente");
        setEditingGroup(null);
      } else {
        setGroups(prevGroups);
        toast.error(`No se pudo actualizar el grupo: ${result.error}`);
      }
    } catch {
      setGroups(prevGroups);
      toast.error("Error inesperado al actualizar el grupo");
    } finally {
      setIsSaving(false);
    }
  }, [editingGroup, formName, formDesc, formVisibility, groups]);

  const visibleGroups = React.useMemo(() => {
    if (!groups) return [] as GroupForClient[];
    if (visibilityFilter === "all") return groups;
    return groups.filter((g) => g.visibility === visibilityFilter);
  }, [groups, visibilityFilter]);

  // Handler para eliminar un artículo del grupo con actualización optimista
  const handleRemoveArticle = React.useCallback(async (groupId: string, articleId: string) => {
    const prev = groups;
    const optimistic = groups.map((g) =>
      g.id === groupId ? { ...g, items: (g.items ?? []).filter((it) => it.article_id !== articleId), article_count: (g.article_count ?? (g.items?.length ?? 0)) - 1 } : g
    );
    setGroups(optimistic);
    const res = await removeArticleFromGroup({ groupId, articleId });
    if (!res.success) {
      setGroups(prev);
      toast.error(res.error || "No se pudo eliminar el artículo del grupo");
    } else {
      toast.success("Artículo eliminado del grupo");
    }
  }, [groups]);

  // Abrir editor para crear nota
  const openCreateNote = React.useCallback((groupId: string, articleId: string, articleTitle?: string | null) => {
    setSelectedGroupId(groupId);
    setSelectedArticleId(articleId);
    setSelectedArticleTitle(articleTitle ?? null);
    setNoteEditorOpen(true);
  }, []);

  // Columnas de la tabla de artículos (simple, sin subfilas)
  const getArticleColumns = React.useCallback((groupId: string): ColumnDef<GroupItemForClient, unknown>[] => ([
    {
      accessorKey: "article_title",
      header: "Título",
      meta: { isTruncatable: true, enableCopyButton: true },
      cell: ({ row }) => {
        const it = row.original as GroupItemForClient;
        const isTranslated = !!rowTranslated[it.article_id];
        const title = isTranslated
          ? (it.latestTranslationTitle ?? it.article_title ?? "(Sin título)")
          : (it.article_title ?? "(Sin título)");
        return <StandardText className="truncate" weight="medium">{title}</StandardText>;
      },
    },
    {
      accessorKey: "description",
      header: "Descripción",
      meta: { isTruncatable: true, tooltipType: "longText" },
      cell: ({ row }) => {
        const it = row.original as GroupItemForClient;
        const isTranslated = !!rowTranslated[it.article_id];
        const desc = isTranslated
          ? (it.latestTranslationSummary ?? null)
          : (it.description ?? null);
        return desc ? (
          <StandardText size="sm" colorScheme="neutral" colorShade="subtle" className="truncate">{desc}</StandardText>
        ) : (
          <StandardText size="sm" colorScheme="neutral" colorShade="subtle">—</StandardText>
        );
      },
    },
    {
      id: "translate",
      header: "Traducir",
      enableSorting: false,
      meta: { align: "center", size: 160 },
      cell: ({ row }) => {
        const it = row.original as GroupItemForClient;
        const hasTranslation = !!it.hasTranslation;
        const isTranslated = !!rowTranslated[it.article_id];
        if (!hasTranslation) {
          return (
            <StandardBadge size="sm" styleType="subtle" colorScheme="neutral">Sin traducción</StandardBadge>
          );
        }
        return (
          <div className="flex items-center justify-end gap-2">
            <StandardText size="xs" colorScheme="neutral" colorShade="subtle">Original</StandardText>
            <StandardSwitch
              size="sm"
              colorScheme="primary"
              checked={isTranslated}
              onCheckedChange={(checked) => setRowTranslated((prev) => ({ ...prev, [it.article_id]: checked }))}
              aria-label="Alternar traducción"
            />
            <StandardText size="xs" colorScheme="neutral" colorShade="subtle">Traducido</StandardText>
            {it.latestTranslationLanguage && (
              <StandardBadge size="sm" styleType="subtle" colorScheme="secondary">{it.latestTranslationLanguage}</StandardBadge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      meta: { align: "right", isSticky: "right", size: 260 },
      cell: ({ row }) => {
        const hasNotes = !!row.original.hasNotes;
        return (
          <div className="flex gap-2 justify-end">
            {hasNotes && (
              <StandardButton
                iconOnly={true}
                size="sm"
                styleType="solid"
                colorScheme="primary"
                leftIcon={StickyNote}
                tooltip="Ver notas"
                onClick={() => window.open(`/articulos/notas?articleId=${row.original.article_id}&mode=editor`, "_blank", "noopener,noreferrer")}
              />
            )}
            {!hasNotes && (
              <StandardButton
                iconOnly={true}
                size="sm"
                styleType="outline"
                colorScheme="primary"
                leftIcon={StickyNote}
                tooltip="Crear nota"
                onClick={() => openCreateNote(groupId, row.original.article_id, row.original.article_title)}
              />
            )}
            <StandardButton
              styleType="outline"
              colorScheme="primary"
              size="sm"
              onClick={() => {
                const it = row.original as GroupItemForClient;
                const isTranslated = !!rowTranslated[it.article_id];
                window.location.href = `/articulos/detalle?articleId=${it.article_id}&translated=${isTranslated ? "true" : "false"}`;
              }}
            >
              Ver detalle
            </StandardButton>
            <StandardButton
              styleType="outline"
              colorScheme="danger"
              size="sm"
              onClick={() => handleRemoveArticle(groupId, row.original.article_id)}
            >
              Eliminar
            </StandardButton>
          </div>
        );
      },
    },
  ]), [handleRemoveArticle, openCreateNote, rowTranslated]);

  if (!visibleGroups || visibleGroups.length === 0) {
    return (
      <StandardEmptyState
        title="Sin resultados"
        description="No hay grupos que coincidan con el filtro seleccionado."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StandardAccordion type="multiple" styleType="subtle" defaultValue={focusGroupId ? [focusGroupId] : undefined}>
        {visibleGroups.map((g, idx) => {
          const colorCycle: ("primary"|"secondary"|"tertiary"|"accent"|"neutral")[] = ["primary","secondary","tertiary","accent","neutral"];
          const itemColor = colorCycle[idx % colorCycle.length];
          const items: GroupItemForClient[] = Array.isArray(g.items) ? g.items : [];
          const count = g.article_count ?? items.length;
          const isPublic = g.visibility === "public";
          return (
            <StandardAccordionItem key={g.id} value={g.id} colorScheme={itemColor}>
              <StandardAccordionTrigger titleAlign="left">
                <div className="flex w-full items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <StandardText weight="semibold" size="xl" className="truncate">{g.name || "(Sin nombre)"}</StandardText>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <StandardBadge size="sm" styleType="subtle" colorScheme={isPublic ? "success" : "neutral"}>
                        {isPublic ? "Público" : "Privado"}
                      </StandardBadge>
                      <StandardBadge size="sm" styleType="subtle" colorScheme="primary">
                        {count} artículo{count === 1 ? "" : "s"}
                      </StandardBadge>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StandardButton
                      styleType="outline"
                      colorScheme="primary"
                      size="sm"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(g); }}
                    >
                      Editar
                    </StandardButton>
                  </div>
                </div>
              </StandardAccordionTrigger>
              <StandardAccordionContent>
                <div className="space-y-3">
                  {g.description && (
                    <StandardText size="sm" colorScheme="neutral" colorShade="subtle">{g.description}</StandardText>
                  )}
                  <div>
                    {items.length === 0 ? (
                      <StandardEmptyState
                        title="Sin artículos"
                        description="Este grupo no contiene artículos."
                      />
                    ) : (
                      <StandardTable
                        data={items}
                        columns={getArticleColumns(g.id)}
                        isStickyHeader={false}
                        enableTruncation
                        filterPlaceholder="Filtrar artículos..."
                        // 🎛️ Control de UI del toolbar
                        showToolbar={false}
                        showColumnSelector={false}
                        showTruncationDropdown={true}
                        // 🎨 Sincroniza el color del header de la tabla con el acordeón
                        colorScheme={itemColor}
                      >
                        <StandardTable.Table />
                      </StandardTable>
                    )}
                  </div>
                </div>
              </StandardAccordionContent>
            </StandardAccordionItem>
          );
        })}
      </StandardAccordion>

      {/* Modal de Edición */}
      <StandardDialog open={!!editingGroup} onOpenChange={(open) => { if (!open) closeEdit(); }}>
        <StandardDialog.Content size="md" colorScheme="neutral">
          <StandardDialog.Header>
            <StandardDialog.Title>Editar grupo</StandardDialog.Title>
            <StandardDialog.Description>
              Actualiza el nombre, la descripción y la visibilidad del grupo.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Body>
            <div className="space-y-4">
              <StandardFormField label="Nombre" htmlFor="group-name" isRequired>
                <StandardInput
                  id="group-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={isSaving}
                  isEditing
                />
              </StandardFormField>

              <StandardFormField label="Descripción" htmlFor="group-desc">
                <StandardTextarea
                  id="group-desc"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  disabled={isSaving}
                  isEditing
                  rows={3}
                />
              </StandardFormField>

              <StandardFormField
                label="Visibilidad"
                htmlFor="group-visibility"
                hint="Público: visible para todos en el proyecto. Privado: solo tú."
              >
                <StandardSelect
                  id="group-visibility"
                  options={[
                    { value: "public", label: "Público" },
                    { value: "private", label: "Privado" },
                  ]}
                  value={formVisibility}
                  onChange={(v) => setFormVisibility((v as "public" | "private") ?? "private")}
                  disabled={isSaving}
                />
              </StandardFormField>
            </div>
          </StandardDialog.Body>
          <StandardDialog.Footer>
            <StandardButton
              styleType="outline"
              colorScheme="neutral"
              onClick={closeEdit}
              disabled={isSaving}
            >
              Cancelar
            </StandardButton>
            <StandardButton
              styleType="solid"
              colorScheme="primary"
              onClick={handleSave}
              loading={isSaving}
            >
              Guardar cambios
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
      {noteEditorOpen && selectedArticleId && (
        <GroupNoteEditor
          open={noteEditorOpen}
          onClose={() => setNoteEditorOpen(false)}
          articleId={selectedArticleId}
          articleTitle={selectedArticleTitle ?? undefined}
          onCreated={() => {
            // Actualizar estado local para reflejar que el artículo ahora tiene notas
            if (!selectedGroupId || !selectedArticleId) return;
            setGroups((prev) => prev.map((g) => {
              if (g.id !== selectedGroupId) return g;
              const items = Array.isArray(g.items) ? g.items : [];
              const updatedItems = items.map((it) =>
                it.article_id === selectedArticleId ? { ...it, hasNotes: true } : it
              );
              return { ...g, items: updatedItems };
            }));
          }}
        />
      )}
    </div>
  );
}


