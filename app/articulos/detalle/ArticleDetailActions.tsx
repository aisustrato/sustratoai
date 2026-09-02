"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { StandardButton } from "@/components/ui/StandardButton";
import GroupNoteEditor from "@/app/articulos/grupos/GroupNoteEditor";
import CreateGroupPopup from "@/app/articulos/grupos/CreateGroupPopup";

interface ArticleDetailActionsProps {
  articleId: string;
  articleTitle?: string | null;
  hasNotesForArticle: boolean;
  noteHref: string;
}

export default function ArticleDetailActions({
  articleId,
  articleTitle,
  hasNotesForArticle,
  noteHref,
}: ArticleDetailActionsProps) {
  const t = useTranslations("articulos.articleDetailActions");
  const router = useRouter();
  const [openNote, setOpenNote] = useState(false);
  const [openGroup, setOpenGroup] = useState(false);
  const [notesExist, setNotesExist] = useState<boolean>(hasNotesForArticle);

  const handleNoteCreated = () => {
    setNotesExist(true);
    router.refresh();
  };

  const handleGroupCreated = () => {
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      {notesExist ? (
        <>
          <StandardButton asChild styleType="outline" colorScheme="primary">
            <a href={noteHref}>{t("viewNote")}</a>
          </StandardButton>
          <StandardButton styleType="solid" colorScheme="primary" onClick={() => setOpenNote(true)}>
            {t("newNote")}
          </StandardButton>
        </>
      ) : (
        <StandardButton styleType="solid" colorScheme="primary" onClick={() => setOpenNote(true)}>
          {t("createNote")}
        </StandardButton>
      )}

      <StandardButton styleType="outline" colorScheme="secondary" onClick={() => setOpenGroup(true)}>
        {t("createGroup")}
      </StandardButton>

      <GroupNoteEditor
        open={openNote}
        onClose={() => setOpenNote(false)}
        articleId={articleId}
        articleTitle={articleTitle}
        onCreated={handleNoteCreated}
      />

      <CreateGroupPopup
        open={openGroup}
        onClose={() => setOpenGroup(false)}
        articleId={articleId}
        articleTitle={articleTitle}
        onCreated={handleGroupCreated}
      />
    </div>
  );
}
