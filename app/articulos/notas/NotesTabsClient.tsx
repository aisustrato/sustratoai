"use client";

import * as React from "react";
import { StandardTabs, StandardTabsList, StandardTabsTrigger } from "@/components/ui/StandardTabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import StandardCardWithContent from "./StandardCardWithContentClient";
import type { DetailedNote } from "@/lib/actions/article-notes-actions";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";
import GroupNotesTabClient, { type GroupWithNotes } from "./GroupNotesTabClient";

interface NotesTabsClientProps {
  notasPrivadas: DetailedNote[];
  notasPublicas: DetailedNote[];
  groups?: GroupWithNotes[];
  defaultValue?: "privadas" | "publicas" | "grupos";
  // Auto-apertura de nota específica
  autoOpenNoteId?: string | null;
  autoOpenArticleId?: string | null;
  autoOpenMode?: "editor" | "divided" | "preview";
  autoOpenVisibility?: "private" | "public" | null;
}

export default function NotesTabsClient({ notasPrivadas, notasPublicas, groups, defaultValue = "privadas", autoOpenNoteId, autoOpenArticleId, autoOpenMode = "preview", autoOpenVisibility }: NotesTabsClientProps) {
  const [value, setValue] = React.useState<"privadas" | "publicas" | "grupos">(defaultValue);
  const [pendingValue, setPendingValue] = React.useState<"privadas" | "publicas" | "grupos" | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);

  // Dirty tracking por nota y por tab
  const [dirtyPrivadasMap, setDirtyPrivadasMap] = React.useState<Record<string, boolean>>({});
  const [dirtyPublicasMap, setDirtyPublicasMap] = React.useState<Record<string, boolean>>({});
  const anyDirtyPrivadas = React.useMemo(() => Object.values(dirtyPrivadasMap).some(Boolean), [dirtyPrivadasMap]);
  const anyDirtyPublicas = React.useMemo(() => Object.values(dirtyPublicasMap).some(Boolean), [dirtyPublicasMap]);
  // Dirty tracking para pestaña de grupos (track por noteId)
  const [dirtyGruposMap, setDirtyGruposMap] = React.useState<Record<string, boolean>>({});
  const anyDirtyGrupos = React.useMemo(() => Object.values(dirtyGruposMap).some(Boolean), [dirtyGruposMap]);

  // Señales de reset por tab (incremento para forzar efecto en hijos)
  const [resetSignalPrivadas, setResetSignalPrivadas] = React.useState(0);
  const [resetSignalPublicas, setResetSignalPublicas] = React.useState(0);
  const [resetSignalGrupos, setResetSignalGrupos] = React.useState(0);

  const handleTabChange = (next: string) => {
    const nextValue = (next === "publicas" ? "publicas" : next === "grupos" ? "grupos" : "privadas") as
      | "privadas"
      | "publicas"
      | "grupos";
    const currentDirty = value === "privadas" ? anyDirtyPrivadas : value === "publicas" ? anyDirtyPublicas : anyDirtyGrupos;
    if (currentDirty) {
      setPendingValue(nextValue);
      setShowUnsavedDialog(true);
      return;
    }
    setValue(nextValue);
  };

  const confirmDiscardAndSwitch = () => {
    if (value === "privadas") {
      setResetSignalPrivadas((s) => s + 1);
      setDirtyPrivadasMap({});
    } else if (value === "publicas") {
      setResetSignalPublicas((s) => s + 1);
      setDirtyPublicasMap({});
    } else {
      setResetSignalGrupos((s) => s + 1);
      setDirtyGruposMap({});
    }
    if (pendingValue) setValue(pendingValue);
    setPendingValue(null);
    setShowUnsavedDialog(false);
  };

  const cancelSwitch = () => {
    setPendingValue(null);
    setShowUnsavedDialog(false);
  };

  const onDirtyChangeFactory = (tab: "privadas" | "publicas", id?: string) => (dirty: boolean) => {
    if (!id) return;
    if (tab === "privadas") {
      setDirtyPrivadasMap((prev) => ({ ...prev, [id]: dirty }));
    } else {
      setDirtyPublicasMap((prev) => ({ ...prev, [id]: dirty }));
    }
  };

  const onGroupNoteDirtyChange = (noteId: string, dirty: boolean) => {
    setDirtyGruposMap((prev) => ({ ...prev, [noteId]: dirty }));
  };

  return (
    <>
      <StandardTabs value={value} onValueChange={handleTabChange} styleType="line" colorScheme="accent" size="md">
        <StandardTabsList>
          <StandardTabsTrigger value="privadas">Privadas</StandardTabsTrigger>
          <StandardTabsTrigger value="publicas">Públicas</StandardTabsTrigger>
          <StandardTabsTrigger value="grupos">Grupos</StandardTabsTrigger>
        </StandardTabsList>

        <TabsContent value="privadas" className="p-4 border rounded-md border-t-0 rounded-t-none">
          {notasPrivadas.length === 0 ? (
            <StandardEmptyState
              title="Sin notas privadas"
              description="Crea notas privadas para tus artículos. Solo tú podrás verlas."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {notasPrivadas.map((n) => (
                <StandardCardWithContent
                  key={n.id}
                  note={n}
                  colorScheme="accent"
                  styleType="subtle"
                  hasOutline
                  outlineColorScheme="accent"
                  onDirtyChange={onDirtyChangeFactory("privadas", String(n.id))}
                  resetSignal={resetSignalPrivadas}
                  autoOpen={
                    (autoOpenVisibility ? autoOpenVisibility === "private" : true) &&
                    (
                      (autoOpenNoteId ? String(n.id) === String(autoOpenNoteId) : false) ||
                      (autoOpenArticleId ? String(n.article_id) === String(autoOpenArticleId) : false)
                    )
                  }
                  autoOpenMode={autoOpenMode}
                  autoScrollIntoView={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="publicas" className="p-4 border rounded-md border-t-0 rounded-t-none">
          {notasPublicas.length === 0 ? (
            <StandardEmptyState
              title="Sin notas públicas"
              description="Aún no hay notas públicas en este proyecto. Comparte conocimiento con tu equipo creando una."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {notasPublicas.map((n) => (
                <StandardCardWithContent
                  key={n.id}
                  note={n}
                  colorScheme="accent"
                  styleType="subtle"
                  hasOutline
                  outlineColorScheme="accent"
                  onDirtyChange={onDirtyChangeFactory("publicas", String(n.id))}
                  resetSignal={resetSignalPublicas}
                  autoOpen={
                    (autoOpenVisibility ? autoOpenVisibility === "public" : true) &&
                    (
                      (autoOpenNoteId ? String(n.id) === String(autoOpenNoteId) : false) ||
                      (autoOpenArticleId ? String(n.article_id) === String(autoOpenArticleId) : false)
                    )
                  }
                  autoOpenMode={autoOpenMode}
                  autoScrollIntoView={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grupos" className="p-4 border rounded-md border-t-0 rounded-t-none">
          {!groups || groups.length === 0 ? (
            <StandardEmptyState
              title="Sin grupos con notas"
              description="No hay grupos con notas en este proyecto."
            />
          ) : (
            <GroupNotesTabClient
              groups={groups}
              onNoteDirtyChange={onGroupNoteDirtyChange}
              resetSignal={resetSignalGrupos}
            />
          )}
        </TabsContent>
      </StandardTabs>

      {/* Diálogo global para cambio de pestaña con cambios sin guardar */}
      <StandardDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <StandardDialog.Content size="sm">
          <StandardDialog.Header>
            <StandardDialog.Title>Hay cambios sin guardar</StandardDialog.Title>
            <StandardDialog.Description>
              Estás cambiando de pestaña. Si continúas, se perderán los cambios de edición en esta pestaña.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" colorScheme="neutral" onClick={cancelSwitch}>
              Permanecer en esta pestaña
            </StandardButton>
            <StandardButton styleType="solid" colorScheme="warning" onClick={confirmDiscardAndSwitch}>
              Cambiar y descartar cambios
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </>
  );
}
