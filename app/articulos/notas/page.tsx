import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import NotesTabsClient from "./NotesTabsClient";
import { getGroups, getGroupDetails, type GroupWithArticleCount } from "@/lib/actions/article-group-actions";
import { getNotes } from "@/lib/actions/article-notes-actions";
import { obtenerProyectosConSettingsUsuario } from "@/lib/actions/project-dashboard-actions";
import { getCurrentUser } from "@/lib/server";
import type { Database } from "@/lib/database.types";
import type { DetailedNote } from "@/lib/actions/article-notes-actions";
import ArticleNotesTitleClient from "./ArticleNotesTitleClient";


type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function ArticleNotesPage({ searchParams = {} }: PageProps) {
  // Obtener usuario autenticado en servidor
  const user = await getCurrentUser();

  // Si no hay usuario, mostramos estado vacío contextual
  if (!user) {
    return (
      <StandardPageBackground variant="default">
        <div className="p-4 sm:p-6">
          <ArticleNotesTitleClient
            title="Notas de Artículos"
            subtitle="Gestiona y organiza tus notas por visibilidad"
            backHref="/articulos"
          />
          <div className="mt-6">
            <StandardEmptyState
              title="Inicia sesión para ver tus notas"
              description="Necesitas estar autenticado para acceder a tus notas privadas y públicas del proyecto."
            />
          </div>
        </div>
      </StandardPageBackground>
    );
  }

  // Buscar proyecto activo del usuario
  const proyectosRes = await obtenerProyectosConSettingsUsuario(user.id);
  const proyectoActivo = proyectosRes.success
    ? proyectosRes.data.find((p) => p.is_active_for_user)
    : undefined;

  if (!proyectoActivo) {
    return (
      <StandardPageBackground variant="default">
        <div className="p-4 sm:p-6">
          <ArticleNotesTitleClient
            title="Notas de Artículos"
            subtitle="Gestiona y organiza tus notas por visibilidad"
            backHref="/articulos"
          />
          <div className="mt-6">
            <StandardEmptyState
              title="Selecciona un proyecto activo"
              description="No encontramos un proyecto activo asociado a tu usuario. Selecciona o activa un proyecto para ver sus notas."
            />
          </div>
        </div>
      </StandardPageBackground>
    );
  }

  // Cargar notas privadas y públicas del proyecto activo
  const privateVis: Database["public"]["Enums"]["note_visibility"] = "private";
  const publicVis: Database["public"]["Enums"]["note_visibility"] = "public";
  const [privadasRes, publicasRes] = await Promise.all([
    getNotes({ projectId: proyectoActivo.id, authorId: user.id, visibility: privateVis }),
    getNotes({ projectId: proyectoActivo.id, visibility: publicVis }),
  ]);

  const notasPrivadas: DetailedNote[] = privadasRes.success ? privadasRes.data : [];
  const notasPublicas: DetailedNote[] = publicasRes.success ? publicasRes.data : [];

  // Las notas ya vienen enriquecidas con article_title desde getNotes
  const notasPrivadasEnriched = notasPrivadas;
  const notasPublicasEnriched = notasPublicas;

  // Cargar grupos del usuario + grupos públicos del proyecto (respetando RLS) y filtrar por proyecto activo
  const [userGroupsRes, allGroupsRes] = await Promise.all([
    getGroups({ userId: user.id }),
    getGroups({}),
  ]);

  const userGroupsInProject: GroupWithArticleCount[] = userGroupsRes.success
    ? userGroupsRes.data.filter((g) => g.project_id === proyectoActivo.id)
    : [];
  const publicGroupsInProject: GroupWithArticleCount[] = allGroupsRes.success
    ? allGroupsRes.data.filter((g) => g.project_id === proyectoActivo.id && g.visibility === "public")
    : [];

  // Unificar por id (evitar duplicados)
  const groupsById = new Map<string, GroupWithArticleCount>();
  for (const g of [...userGroupsInProject, ...publicGroupsInProject]) {
    groupsById.set(String(g.id), g);
  }
  const projectGroups = Array.from(groupsById.values());

  // Pre-indexar notas por article_id para unión eficiente
  const privateByArticle = new Map<string, DetailedNote[]>();
  for (const n of notasPrivadasEnriched) {
    const aid = n.article_id;
    if (!aid) continue;
    const arr = privateByArticle.get(aid) ?? [];
    arr.push(n);
    privateByArticle.set(aid, arr);
  }
  const publicByArticle = new Map<string, DetailedNote[]>();
  for (const n of notasPublicasEnriched) {
    const aid = n.article_id;
    if (!aid) continue;
    const arr = publicByArticle.get(aid) ?? [];
    arr.push(n);
    publicByArticle.set(aid, arr);
  }

  // Obtener detalles de grupos para conocer sus artículos
  const groupDetailsResults = await Promise.all(
    projectGroups.map(async (g) => ({ id: String(g.id), base: g, res: await getGroupDetails(String(g.id)) }))
  );

  const groupsWithNotes = groupDetailsResults.reduce((acc, it) => {
    if (!it.res.success || !it.res.data) return acc;
    const items = it.res.data.items as { article_id: string | null }[];
    const notesPrivate = items.flatMap((i) => (i.article_id ? privateByArticle.get(i.article_id) ?? [] : []));
    const notesPublic = items.flatMap((i) => (i.article_id ? publicByArticle.get(i.article_id) ?? [] : []));
    if (notesPrivate.length > 0 || notesPublic.length > 0) {
      acc.push({
        id: it.id,
        name: it.base.name,
        visibility: it.base.visibility as "public" | "private" | string,
        notesPrivate,
        notesPublic,
      });
    }
    return acc;
  }, [] as {
    id: string;
    name: string;
    visibility: "public" | "private" | string;
    notesPrivate: DetailedNote[];
    notesPublic: DetailedNote[];
  }[]);

  // Leer parámetros de búsqueda para auto-abrir nota en detalle
  const noteIdParam = typeof searchParams.noteId === "string" ? searchParams.noteId : undefined;
  const articleIdParam = typeof searchParams.articleId === "string" ? searchParams.articleId : undefined;
  const modeParam =
    searchParams.mode === "editor" || searchParams.mode === "divided" || searchParams.mode === "preview"
      ? (searchParams.mode as "editor" | "divided" | "preview")
      : undefined;
  const visibilityParam =
    searchParams.visibility === "private" || searchParams.visibility === "public"
      ? (searchParams.visibility as "private" | "public")
      : undefined;

  // Inferir pestaña por defecto y visibilidad si no se especifica
  let inferredTab: "privadas" | "publicas" | undefined = undefined;
  let inferredVisibility: "private" | "public" | null = null;

  if (visibilityParam) {
    inferredTab = visibilityParam === "private" ? "privadas" : "publicas";
    inferredVisibility = visibilityParam;
  } else if (noteIdParam) {
    const existsInPrivate = notasPrivadasEnriched.some((n) => String(n.id) === String(noteIdParam));
    const existsInPublic = notasPublicasEnriched.some((n) => String(n.id) === String(noteIdParam));
    if (existsInPrivate) {
      inferredTab = "privadas";
      inferredVisibility = "private";
    } else if (existsInPublic) {
      inferredTab = "publicas";
      inferredVisibility = "public";
    }
  } else if (articleIdParam) {
    const existsInPrivate = notasPrivadasEnriched.some((n) => String(n.article_id) === String(articleIdParam));
    const existsInPublic = notasPublicasEnriched.some((n) => String(n.article_id) === String(articleIdParam));
    if (existsInPrivate) {
      inferredTab = "privadas";
      inferredVisibility = "private";
    } else if (existsInPublic) {
      inferredTab = "publicas";
      inferredVisibility = "public";
    }
  }

  const defaultTab = inferredTab ?? "privadas";

  return (
    <StandardPageBackground variant="default">
      <div className="p-4 sm:p-6">
        <ArticleNotesTitleClient
          title="Notas de Artículos"
          subtitle={
            proyectoActivo
              ? `Proyecto activo: ${proyectoActivo.name}`
              : "Gestiona y organiza tus notas por visibilidad"
          }
          backHref="/articulos"
        />

        <div className="mt-4">
          <NotesTabsClient
            notasPrivadas={notasPrivadasEnriched}
            notasPublicas={notasPublicasEnriched}
            groups={groupsWithNotes}
            defaultValue={defaultTab}
            autoOpenNoteId={noteIdParam ?? null}
            autoOpenArticleId={articleIdParam ?? null}
            autoOpenMode={modeParam ?? "preview"}
            autoOpenVisibility={inferredVisibility}
          />
        </div>
      </div>
    </StandardPageBackground>
  );
}
