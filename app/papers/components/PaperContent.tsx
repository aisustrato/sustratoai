// 📍 app/papers/components/PaperContent.tsx
// Renderiza el contenido Markdown del paper con react-markdown

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

interface PaperContentProps {
  content: string;
}

export function PaperContent({ content }: PaperContentProps) {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ]}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
