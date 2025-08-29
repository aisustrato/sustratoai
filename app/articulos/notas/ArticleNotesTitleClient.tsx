"use client";

import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { FileText } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  backHref: string;
}

export default function ArticleNotesTitleClient({ title, subtitle, backHref }: Props) {
  return (
    <StandardPageTitle
      title={title}
      subtitle={subtitle}
      mainIcon={FileText}
      showBackButton={{ href: backHref }}
    />
  );
}
