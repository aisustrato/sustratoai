"use client";

import * as React from "react";
import { StandardAccordion, StandardAccordionItem, StandardAccordionTrigger, StandardAccordionContent } from "@/components/ui/StandardAccordion";
import { StandardCheckboxGroup } from "@/components/ui/StandardCheckboxGroup";
import StandardCardWithContent from "./StandardCardWithContentClient";
import type { DetailedNote } from "@/lib/actions/article-notes-actions";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { StandardText } from "@/components/ui/StandardText";

export type GroupWithNotes = {
  id: string;
  name: string;
  visibility: "public" | "private" | string;
  notesPrivate: DetailedNote[];
  notesPublic: DetailedNote[];
};

interface GroupNotesTabClientProps {
  groups: GroupWithNotes[];
  onNoteDirtyChange?: (noteId: string, dirty: boolean) => void;
  resetSignal?: number;
}

export default function GroupNotesTabClient({ groups, onNoteDirtyChange, resetSignal = 0 }: GroupNotesTabClientProps) {
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(["private", "public"]);

  const showPrivate = selectedTypes.includes("private");
  const showPublic = selectedTypes.includes("public");

  // Grupos filtrados según selección actual (si ambos deseleccionados, mostramos todos para evitar confusión)
  const filteredGroups = React.useMemo(() => {
    if (groups.length === 0) return [] as (GroupWithNotes & { filteredNotes: DetailedNote[] })[];
    const effectivePrivate = showPrivate || (!showPrivate && !showPublic);
    const effectivePublic = showPublic || (!showPrivate && !showPublic);

    return groups
      .map((g) => {
        const filteredNotes = [
          ...(effectivePrivate ? g.notesPrivate : []),
          ...(effectivePublic ? g.notesPublic : []),
        ];
        return { ...g, filteredNotes };
      })
      .filter((g) => g.filteredNotes.length > 0);
  }, [groups, showPrivate, showPublic]);

  return (
    <div className="flex flex-col gap-4">
      <StandardCheckboxGroup
        label="Tipos de notas a mostrar"
        description="Selecciona si deseas ver notas privadas, públicas o ambas"
        options={[
          { value: "private", label: "Privadas" },
          { value: "public", label: "Públicas" },
        ]}
        value={selectedTypes}
        onChange={setSelectedTypes}
        colorScheme="accent"
        orientation="horizontal"
      />

      {filteredGroups.length === 0 ? (
        <StandardEmptyState
          title="Sin grupos con notas"
          description="No hay grupos con notas para los filtros seleccionados."
        />
      ) : (
        <StandardAccordion type="multiple" colorScheme="accent" className="w-full">
          {filteredGroups.map((group) => (
            <StandardAccordionItem key={group.id} value={group.id}>
              <StandardAccordionTrigger>
                <div className="flex w-full items-center justify-between">
                  <StandardText weight="medium">{group.name}</StandardText>
                  <span className="inline-flex items-center justify-center rounded-full bg-accent/10 text-accent-700 dark:text-accent-300 px-2 py-0.5 text-xs">
                    {group.filteredNotes.length}
                  </span>
                </div>
              </StandardAccordionTrigger>
              <StandardAccordionContent>
                <div className="grid grid-cols-1 gap-3">
                  {group.filteredNotes.map((note) => (
                    <StandardCardWithContent
                      key={`${group.id}-${note.id}`}
                      note={note}
                      colorScheme="accent"
                      styleType="subtle"
                      hasOutline
                      outlineColorScheme="accent"
                      onDirtyChange={(dirty) => onNoteDirtyChange?.(String(note.id), dirty)}
                      resetSignal={resetSignal}
                    />
                  ))}
                </div>
              </StandardAccordionContent>
            </StandardAccordionItem>
          ))}
        </StandardAccordion>
      )}
    </div>
  );
}
