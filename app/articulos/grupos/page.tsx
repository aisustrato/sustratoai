import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { getCurrentUser } from "@/lib/server";
import { obtenerProyectosConSettingsUsuario } from "@/lib/actions/project-dashboard-actions";
import { getGroups, getGroupDetails, type GroupWithArticleCount } from "@/lib/actions/article-group-actions";
import { getNotes } from "@/lib/actions/article-notes-actions";
import { getLatestTranslationsForArticles } from "@/lib/actions/article-actions";
import type { Database } from "@/lib/database.types";
import GroupsPageClient from "./GroupsPageClient";

export type GroupItemForClient = {
  article_id: string;
  article_title: string | null;
  description: string | null;
  hasNotes?: boolean;
  hasTranslation?: boolean;
  latestTranslationTitle?: string | null;
  latestTranslationSummary?: string | null;
  latestTranslationLanguage?: string | null;
};

export type GroupForClient = {
  id: string;
  name: string;
  description: string | null;
  visibility: Database["public"]["Enums"]["group_visibility"];
  project_id: string;
  user_id: string;
  created_at?: string;
  article_count?: number;
  items: GroupItemForClient[];
};

export default async function ArticleGroupsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <StandardPageBackground variant="default">
        <div className="p-4 sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <StandardText preset="title">Grupos de Artículos</StandardText>
            <StandardButton asChild styleType="outline" colorScheme="neutral">
              <a href="/articulos">Volver</a>
            </StandardButton>
          </div>
          <StandardEmptyState
            title="Inicia sesión para gestionar grupos"
            description="Necesitas estar autenticado para ver y administrar tus grupos."
          />
        </div>
      </StandardPageBackground>
    );
  }

  const proyectosRes = await obtenerProyectosConSettingsUsuario(user.id);
  const proyectoActivo = proyectosRes.success
    ? proyectosRes.data.find((p) => p.is_active_for_user)
    : undefined;

  if (!proyectoActivo) {
    return (
      <StandardPageBackground variant="default">
        <div className="p-4 sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <StandardText preset="title">Grupos de Artículos</StandardText>
            <StandardButton asChild styleType="outline" colorScheme="neutral">
              <a href="/articulos">Volver</a>
            </StandardButton>
          </div>
          <StandardEmptyState
            title="Selecciona un proyecto activo"
            description="No encontramos un proyecto activo asociado a tu usuario. Selecciona o activa un proyecto para gestionar sus grupos."
          />
        </div>
      </StandardPageBackground>
    );
  }

  // Cargar grupos del usuario y grupos públicos del proyecto
  const [userGroupsRes, allGroupsRes] = await Promise.all([
    getGroups({ userId: user.id }),
    getGroups({}),
  ]);

  const userGroupsInProject: GroupWithArticleCount[] = userGroupsRes.success
    ? userGroupsRes.data.filter((g) => g.project_id === proyectoActivo.id)
    : [];
  const publicGroupsInProject: GroupWithArticleCount[] = allGroupsRes.success
    ? allGroupsRes.data.filter(
        (g) => g.project_id === proyectoActivo.id && g.visibility === "public"
      )
    : [];

  // Unificar por id evitando duplicados
  const groupsById = new Map<string, GroupWithArticleCount>();
  for (const g of [...userGroupsInProject, ...publicGroupsInProject]) {
    groupsById.set(String(g.id), g);
  }
  const projectGroups = Array.from(groupsById.values());

  // Obtener todas las notas del proyecto una sola vez para marcar artículos con notas
  const notesRes = await getNotes({ projectId: proyectoActivo.id });
  const articleIdsWithNotes = new Set<string>(
    notesRes.success ? notesRes.data.map((n) => String(n.article_id)) : []
  );

  // Obtener detalles de artículos por grupo
  const groupsWithDetails: GroupForClient[] = (
    await Promise.all(
      projectGroups.map(async (g) => {
        const details = await getGroupDetails(String(g.id));
        if (details.success && details.data) {
          return {
            id: String(details.data.id),
            name: details.data.name ?? "",
            description: details.data.description ?? null,
            visibility: details.data.visibility,
            project_id: details.data.project_id,
            user_id: details.data.user_id,
            created_at: details.data.created_at,
            article_count: g.article_count,
            items: details.data.items.map((it) => ({
              article_id: it.article_id,
              article_title: it.article_title,
              description: it.description,
              hasNotes: articleIdsWithNotes.has(String(it.article_id)),
            })),
          } as GroupForClient;
        }
        return null;
      })
    )
  ).filter((x): x is GroupForClient => x !== null);

  // Recolectar todos los article_ids únicos para buscar su última traducción
  const allArticleIds = Array.from(
    new Set(
      groupsWithDetails.flatMap((g) => (Array.isArray(g.items) ? g.items : []).map((it) => String(it.article_id)))
    )
  );

  const latestMapRes = await getLatestTranslationsForArticles(allArticleIds);
  const latestMap = latestMapRes.success ? latestMapRes.data : {};

  const enrichedGroups: GroupForClient[] = groupsWithDetails.map((g) => ({
    ...g,
    items: g.items.map((it) => {
      const t = latestMap[String(it.article_id)];
      return {
        ...it,
        hasTranslation: !!t,
        latestTranslationTitle: t ? t.title ?? null : null,
        latestTranslationSummary: t ? (t.abstract ?? t.summary ?? null) : null,
        latestTranslationLanguage: t ? (t.language ?? null) : null,
      };
    }),
  }));

  return (
    <StandardPageBackground variant="default">
      <GroupsPageClient
        initialGroups={enrichedGroups}
        projectName={proyectoActivo.name}
        focusGroupId={(searchParams?.groupId as string) || undefined}
      />
    </StandardPageBackground>
  );
}
