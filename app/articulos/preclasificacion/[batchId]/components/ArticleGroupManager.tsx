"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { StandardDropdownMenu } from '@/components/ui/StandardDropdownMenu';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardDialog } from '@/components/ui/StandardDialog';
import { StandardPopupWindow } from '@/components/ui/StandardPopupWindow';
import { StandardInput } from '@/components/ui/StandardInput';
import { StandardTextarea } from '@/components/ui/StandardTextarea';
import { StandardCheckbox } from '@/components/ui/StandardCheckbox';
import { StandardText } from '@/components/ui/StandardText';
import { StandardIcon } from '@/components/ui/StandardIcon';
import { StandardTable } from '@/components/ui/StandardTable';
import { StandardFormField } from '@/components/ui/StandardFormField';
import { toast } from 'sonner';
import { 
  getGroups, 
  getGroupDetails,
  addArticlesToGroup, 
  createGroupWithArticles,
  type GroupWithArticleCount,
  type GroupDetails,
  type CreateGroupPayload 
} from '@/lib/actions/article-group-actions';
import { getArticleIdFromBatchItemId, type ArticleForReview } from '@/lib/actions/preclassification-actions';
import { useAuth } from '@/app/auth-provider';
import { Plus, Users, Lock, Globe, ArrowRight, FolderPlus, CheckCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';

interface ArticleGroupManagerProps {
  article: ArticleForReview;
  project: { id: string; name: string; } | null;
}

interface GroupArticleData {
  id: string;
  title: string;
  description?: string;
}

export const ArticleGroupManager: React.FC<ArticleGroupManagerProps> = ({ article, project }) => {
  // Estados para los datos cargados on-demand
  const [menuData, setMenuData] = useState<{
    articleId: string;
    allGroups: GroupWithArticleCount[];
    articleGroups: GroupWithArticleCount[];
    availableGroups: GroupWithArticleCount[];
  } | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Estados para los popups y diálogos
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showPublicWarning, setShowPublicWarning] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  // Estados para el grupo seleccionado
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<GroupWithArticleCount | null>(null);
  const [selectedGroupForDetails, setSelectedGroupForDetails] = useState<GroupWithArticleCount | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  
  // Estados para crear nuevo grupo
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupIsPublic, setNewGroupIsPublic] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estados para acciones
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const { user } = useAuth();
  
  // Función para cargar datos on-demand al abrir el menú
  const loadMenuData = useCallback(async () => {
    if (!article?.item_id) {
      toast.error('Artículo no válido');
      return;
    }
    
    setIsLoadingMenu(true);
    try {
      console.log(`[CLIENT] Cargando datos del menú para batchItem: ${article.item_id}`);
      
      // Paso 1: Obtener articleId real
      const articleIdResult = await getArticleIdFromBatchItemId(article.item_id);
      if (!articleIdResult.success) {
        console.error('[CLIENT] Error al obtener articleId:', articleIdResult.error);
        toast.error('Error al obtener ID del artículo');
        return;
      }
      
      const articleId = articleIdResult.data.articleId;
      console.log(`[CLIENT] ArticleId obtenido: ${articleId}`);
      
      // Paso 2: Cargar todos los grupos y sus conteos de artículos
      const allGroupsResult = await getGroups({ articleId });
      if (!allGroupsResult.success) {
        console.error('[CLIENT] Error al cargar grupos:', allGroupsResult.error);
        toast.error('Error al cargar grupos');
        return;
      }
      
      const allGroupsData = allGroupsResult.data || [];
      
      // Paso 3: Filtrar grupos basado en si el artículo está en cada grupo
      // Si article_count > 0, el artículo está en ese grupo
      const articleGroupsData = allGroupsData.filter(g => g.article_count > 0);
      const availableGroupsData = allGroupsData.filter(g => g.article_count === 0);
      
      console.log(`[CLIENT] Datos cargados - Total: ${allGroupsData.length}, En grupos: ${articleGroupsData.length}, Disponibles: ${availableGroupsData.length}`);
      
      // Paso 5: Guardar datos y abrir menú
      setMenuData({
        articleId,
        allGroups: allGroupsData,
        articleGroups: articleGroupsData,
        availableGroups: availableGroupsData
      });
      
      setMenuOpen(true);
      
    } catch (error) {
      console.error('[CLIENT] Error inesperado al cargar datos del menú:', error);
      toast.error('Error inesperado al cargar datos');
    } finally {
      setIsLoadingMenu(false);
    }
  }, [article?.item_id]);
  
  // Manejar apertura del menú
  const handleMenuOpenChange = (open: boolean) => {
    if (open && !menuData) {
      // Si se abre el menú y no tenemos datos, cargarlos
      loadMenuData();
    } else if (!open) {
      // Si se cierra el menú, mantener los datos pero cerrar
      setMenuOpen(false);
    }
  };

  // Manejar selección de grupo para agregar artículo
  const handleSelectGroupToAdd = (group: GroupWithArticleCount) => {
    setSelectedGroupForAdd(group);
    setShowAddConfirm(true);
  };

  // Manejar confirmación de agregar a grupo existente
  const handleAddToGroup = async () => {
    if (!selectedGroupForAdd || !user || !menuData) return;
    
    setIsAdding(true);
    try {
      const result = await addArticlesToGroup({
        groupId: selectedGroupForAdd.id,
        articleIds: [menuData.articleId]
      });
      
      if (result.success) {
        toast.success(`Artículo agregado al grupo "${selectedGroupForAdd.name}"`);
        setShowAddConfirm(false);
        setSelectedGroupForAdd(null);
        // Limpiar datos para forzar recarga en próxima apertura
        setMenuData(null);
        setMenuOpen(false);
      } else {
        toast.error(`Error al agregar artículo: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al agregar artículo:', error);
      toast.error('Error inesperado al agregar artículo');
    } finally {
      setIsAdding(false);
    }
  };

  // Manejar selección de grupo para ver detalles
  const handleSelectGroupToView = async (group: GroupWithArticleCount) => {
    setSelectedGroupForDetails(group);
    setIsLoadingDetails(true);
    setShowGroupDetails(true);
    
    try {
      const result = await getGroupDetails(group.id);
      
      if (result.success) {
        setGroupDetails(result.data);
      } else {
        toast.error(`Error al cargar detalles del grupo: ${result.error}`);
        setGroupDetails(null);
      }
    } catch (error) {
      console.error('Error al cargar detalles del grupo:', error);
      toast.error('Error inesperado al cargar detalles del grupo');
      setGroupDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Manejar creación de nuevo grupo
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !article || !project) return;
    
    // Si es público, mostrar advertencia primero
    if (newGroupIsPublic) {
      setShowPublicWarning(true);
      return;
    }
    
    await executeCreateGroup();
  };

  // Ejecutar creación de grupo
  const executeCreateGroup = async () => {
    if (!newGroupName.trim() || !article || !project) return;
    
    setIsCreating(true);
    try {
      // Obtener el articleId real
      const articleIdResult = await getArticleIdFromBatchItemId(article.item_id);
      
      if (!articleIdResult.success) {
        toast.error('Error al obtener el ID del artículo');
        return;
      }
      
      const articleId = articleIdResult.data.articleId;
      
      const payload: CreateGroupPayload = {
        projectId: project.id,
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        visibility: newGroupIsPublic ? 'public' : 'private',
        articleIds: [articleId]
      };
      
      const result = await createGroupWithArticles(payload);
      
      if (result.success) {
        toast.success(`Grupo "${newGroupName}" creado exitosamente`);
        // Limpiar formulario
        resetFormAndClose();
        // Limpiar datos para forzar recarga en próxima apertura
        setMenuData(null);
        setMenuOpen(false);
      } else {
        toast.error(`Error al crear grupo: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al crear grupo:', error);
      toast.error('Error inesperado al crear grupo');
    } finally {
      setIsCreating(false);
    }
  };

  // Confirmar creación de grupo público (desde el diálogo de advertencia)
  const confirmPublicGroupFromWarning = () => {
    setShowPublicWarning(false);
    executeCreateGroup();
  };

  // Cancelar creación de grupo público (desde el diálogo de advertencia)
  const cancelPublicGroupFromWarning = () => {
    setShowPublicWarning(false);
    // No cambiamos el estado del checkbox, se mantiene como estaba
  };

  // Manejar click en grupo existente (función no utilizada, se puede eliminar)
  // const handleGroupClick = (group: GroupWithArticleCount) => {
  //   setSelectedGroupForAdd(group);
  //   setShowAddConfirm(true);
  // };

  // Manejar cambios en los campos del formulario
  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGroupName(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleGroupDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewGroupDescription(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleGroupVisibilityChange = (checked: boolean) => {
    if (checked) {
      // Si quiere hacer público, mostrar advertencia primero
      setShowPublicWarning(true);
    } else {
      setNewGroupIsPublic(false);
      setHasUnsavedChanges(true);
    }
  };

  // Confirmar visibilidad pública
  const confirmPublicVisibility = () => {
    setShowPublicWarning(false);
    setNewGroupIsPublic(true);
    setHasUnsavedChanges(true);
  };

  // Cancelar visibilidad pública
  const cancelPublicVisibility = () => {
    setShowPublicWarning(false);
    // No cambiamos el estado, se mantiene como estaba
  };

  // Manejar cierre del formulario de crear grupo
  const handleCloseCreateGroup = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      resetFormAndClose();
    }
  };

  // Confirmar cierre sin guardar
  const confirmClose = () => {
    setShowCloseConfirm(false);
    resetFormAndClose();
  };

  // Cancelar cierre
  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  // Resetear formulario y cerrar
  const resetFormAndClose = () => {
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupIsPublic(false);
    setHasUnsavedChanges(false);
    setShowCreateGroup(false);
  };

  // Manejar apertura del formulario de crear grupo
  const handleCreateNewGroup = () => {
    setShowCreateGroup(true);
  };

  // Configuración de columnas para la tabla de artículos del grupo
  const groupArticlesColumns: ColumnDef<GroupArticleData>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: "Título del Artículo",
      size: 300,
      meta: { isTruncatable: true },
    },
    {
      id: "description",
      accessorKey: "description",
      header: "Descripción",
      size: 200,
      meta: { isTruncatable: true },
      cell: ({ row }) => {
        const description = row.original.description;
        return description ? (
          <StandardText size="sm" colorShade="subtle">
            {description}
          </StandardText>
        ) : (
          <StandardText size="sm" colorShade="subtle" className="italic">
            Sin descripción
          </StandardText>
        );
      },
    },
  ];

  // Transformar datos de artículos del grupo para la tabla
  const groupArticlesData: GroupArticleData[] = groupDetails?.items.map((item) => ({
    id: item.article_id,
    title: item.article_title || "Sin título",
    description: item.description || undefined,
  })) || [];

  return (
    <>
      {/* Botón principal con menú desplegable */}
      <StandardDropdownMenu open={menuOpen || isLoadingMenu} onOpenChange={handleMenuOpenChange}>
        <StandardDropdownMenu.Trigger asChild>
          <StandardButton
            styleType="outline"
            iconOnly={true}
            tooltip="Gestionar Grupos"
            disabled={isLoadingMenu}
          >
            <ArrowRight size={16} />
          </StandardButton>
        </StandardDropdownMenu.Trigger>
        
        <StandardDropdownMenu.Content align="end" className="w-64">
          {isLoadingMenu ? (
            <div className="px-3 py-8 flex flex-col items-center justify-center">
              <SustratoLoadingLogo 
                size={32} 
                variant="spin" 
                speed="normal" 
                showText={true}
                text="Cargando grupos..."
              />
            </div>
          ) : menuData ? (
            <>
              {/* Submenú: Asignar a Grupos */}
              <StandardDropdownMenu.Sub>
                <StandardDropdownMenu.SubTrigger className="flex items-center gap-2">
                  <StandardIcon size="xs" styleType="outline" colorScheme="primary">
                    <FolderPlus />
                  </StandardIcon>
                  Asignar a grupos
                </StandardDropdownMenu.SubTrigger>
                <StandardDropdownMenu.SubContent className="w-56">
                  {menuData.availableGroups.length > 0 ? (
                    <>
                      {menuData.availableGroups.map((group: GroupWithArticleCount) => (
                        <StandardDropdownMenu.Item
                          key={group.id}
                          onSelect={() => handleSelectGroupToAdd(group)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <StandardIcon 
                              size="xs" 
                              styleType="outline"
                              colorScheme={group.visibility === 'public' ? 'primary' : 'neutral'}
                            >
                              {group.visibility === 'public' ? <Globe /> : <Lock />}
                            </StandardIcon>
                            <span className="truncate">{group.name}</span>
                          </div>
                          <StandardText size="xs" colorShade="subtle">
                            ({group.article_count})
                          </StandardText>
                        </StandardDropdownMenu.Item>
                      ))}
                      <StandardDropdownMenu.Separator />
                    </>
                  ) : (
                    <>
                      <StandardText size="sm" colorShade="subtle" className="px-2 py-2 italic">
                        Ya está en todos los grupos
                      </StandardText>
                      <StandardDropdownMenu.Separator />
                    </>
                  )}
                  
                  {/* Opción: Crear nuevo grupo */}
                  <StandardDropdownMenu.Item
                    onSelect={() => setShowCreateGroup(true)}
                    className="flex items-center gap-2"
                  >
                    <StandardIcon size="xs" styleType="outline" colorScheme="primary">
                      <Plus />
                    </StandardIcon>
                    Crear nuevo grupo
                  </StandardDropdownMenu.Item>
                </StandardDropdownMenu.SubContent>
              </StandardDropdownMenu.Sub>
              
              {/* Submenú: Grupos donde está */}
              {menuData.articleGroups.length > 0 && (
                <StandardDropdownMenu.Sub>
                  <StandardDropdownMenu.SubTrigger className="flex items-center gap-2">
                    <StandardIcon size="xs" styleType="outline" colorScheme="success">
                      <CheckCircle />
                    </StandardIcon>
                    Grupos donde está
                  </StandardDropdownMenu.SubTrigger>
                  <StandardDropdownMenu.SubContent className="w-56">
                    {menuData.articleGroups.map((group: GroupWithArticleCount) => (
                      <StandardDropdownMenu.Item
                        key={group.id}
                        onSelect={() => handleSelectGroupToView(group)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <StandardIcon 
                            size="xs" 
                            styleType="outline"
                            colorScheme={group.visibility === 'public' ? 'primary' : 'neutral'}
                          >
                            {group.visibility === 'public' ? <Globe /> : <Lock />}
                          </StandardIcon>
                          <span className="truncate">{group.name}</span>
                        </div>
                        <StandardText size="xs" colorShade="subtle">
                          ({group.article_count})
                        </StandardText>
                      </StandardDropdownMenu.Item>
                    ))}
                  </StandardDropdownMenu.SubContent>
                </StandardDropdownMenu.Sub>
              )}
            </>
          ) : (
            <div className="px-3 py-4 text-center">
              <StandardText size="sm" colorShade="subtle">
                Error al cargar datos
              </StandardText>
            </div>
          )}
        </StandardDropdownMenu.Content>
      </StandardDropdownMenu>

      {/* Diálogo de confirmación para agregar a grupo existente */}
      <StandardDialog open={showAddConfirm} onOpenChange={setShowAddConfirm}>
        <StandardDialog.Content size="sm">
          <StandardDialog.Header>
            <StandardDialog.Title>Confirmar Adición al Grupo</StandardDialog.Title>
            <StandardDialog.Description>
              ¿Estás seguro de que quieres agregar este artículo al grupo "{selectedGroupForAdd?.name}"?
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Body>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StandardIcon 
                  size="sm" 
                  styleType="outline"
                  colorScheme={selectedGroupForAdd?.visibility === 'public' ? 'primary' : 'neutral'}
                >
                  {selectedGroupForAdd?.visibility === 'public' ? <Globe /> : <Lock />}
                </StandardIcon>
                <StandardText size="sm">
                  Grupo {selectedGroupForAdd?.visibility === 'public' ? 'público' : 'privado'}
                </StandardText>
              </div>
              {selectedGroupForAdd?.description && (
                <StandardText size="sm" colorShade="subtle">
                  {selectedGroupForAdd.description}
                </StandardText>
              )}
            </div>
          </StandardDialog.Body>
          <StandardDialog.Footer>
            <StandardButton 
              styleType="outline" 
              onClick={() => setShowAddConfirm(false)}
              disabled={isAdding}
            >
              Cancelar
            </StandardButton>
            <StandardButton 
              styleType="solid" 
              colorScheme="primary" 
              onClick={handleAddToGroup}
              disabled={isAdding}
            >
              {isAdding ? 'Agregando...' : 'Agregar al Grupo'}
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

      {/* Popup para visualizar detalles del grupo */}
      <StandardPopupWindow open={showGroupDetails} onOpenChange={setShowGroupDetails}>
        <StandardPopupWindow.Content size="lg">
          <StandardPopupWindow.Header>
            <StandardPopupWindow.Title>
              Detalles del Grupo: {selectedGroupForDetails?.name}
            </StandardPopupWindow.Title>
            <StandardPopupWindow.Description>
              <div className="flex items-center gap-2 mt-2">
                <StandardIcon 
                  size="sm" 
                  styleType="outline"
                  colorScheme={selectedGroupForDetails?.visibility === 'public' ? 'primary' : 'neutral'}
                >
                  {selectedGroupForDetails?.visibility === 'public' ? <Globe /> : <Lock />}
                </StandardIcon>
                <StandardText size="sm">
                  Grupo {selectedGroupForDetails?.visibility === 'public' ? 'público' : 'privado'} • {selectedGroupForDetails?.article_count} artículo{selectedGroupForDetails?.article_count !== 1 ? 's' : ''}
                </StandardText>
              </div>
            </StandardPopupWindow.Description>
          </StandardPopupWindow.Header>
          
          <StandardPopupWindow.Body className="space-y-4">
            {groupDetails?.description && (
              <div>
                <StandardText size="sm" weight="semibold" className="mb-2">
                  Descripción:
                </StandardText>
                <StandardText size="sm" colorShade="subtle">
                  {groupDetails.description}
                </StandardText>
              </div>
            )}
            
            <div>
              <StandardText size="sm" weight="semibold" className="mb-3">
                Artículos en este grupo:
              </StandardText>
              {isLoadingDetails ? (
                <div className="flex justify-center py-8">
                  <StandardText size="sm" colorShade="subtle">
                    Cargando artículos...
                  </StandardText>
                </div>
              ) : groupArticlesData.length > 0 ? (
                <StandardTable
                  data={groupArticlesData}
                  columns={groupArticlesColumns}
                  enableTruncation={true}
                  filterPlaceholder="Buscar artículos..."
                >
                  <StandardTable.Table />
                </StandardTable>
              ) : (
                <StandardText size="sm" colorShade="subtle" className="italic text-center py-4">
                  No hay artículos en este grupo
                </StandardText>
              )}
            </div>
          </StandardPopupWindow.Body>
          
          <StandardPopupWindow.Footer>
            <StandardButton 
              styleType="outline" 
              onClick={() => setShowGroupDetails(false)}
            >
              Cerrar
            </StandardButton>
          </StandardPopupWindow.Footer>
        </StandardPopupWindow.Content>
      </StandardPopupWindow>

      {/* Popup para crear nuevo grupo */}
      <StandardPopupWindow open={showCreateGroup} onOpenChange={handleCloseCreateGroup}>
        <StandardPopupWindow.Content size="md">
          <StandardPopupWindow.Header>
            <StandardPopupWindow.Title>Crear Nuevo Grupo</StandardPopupWindow.Title>
            <StandardPopupWindow.Description>
              Crea un nuevo grupo y agrega este artículo automáticamente
            </StandardPopupWindow.Description>
          </StandardPopupWindow.Header>
          
          <StandardPopupWindow.Body className="space-y-4">
            <StandardFormField label="Nombre del grupo" htmlFor="group-name" isRequired>
              <StandardInput
                id="group-name"
                placeholder="Ej: Artículos sobre metodología cualitativa"
                value={newGroupName}
                onChange={handleGroupNameChange}
              />
            </StandardFormField>
            
            <StandardFormField label="Descripción (opcional)" htmlFor="group-description">
              <StandardTextarea
                id="group-description"
                placeholder="Describe el propósito o criterios de este grupo..."
                value={newGroupDescription}
                onChange={handleGroupDescriptionChange}
                rows={3}
              />
            </StandardFormField>
            
            <div>
              <StandardCheckbox
                label="Hacer este grupo público"
                description="Los grupos públicos son visibles para todo el equipo del proyecto"
                checked={newGroupIsPublic}
                onChange={(e) => handleGroupVisibilityChange(e.target.checked)}
              />
            </div>
          </StandardPopupWindow.Body>
          
          <StandardPopupWindow.Footer>
            <div className="flex justify-between items-center w-full">
              <StandardText size="sm" colorShade="subtle">
                El artículo actual se agregará automáticamente
              </StandardText>
              <div className="flex gap-2">
                <StandardButton 
                  styleType="outline" 
                  onClick={handleCloseCreateGroup}
                  disabled={isCreating}
                >
                  Cancelar
                </StandardButton>
                <StandardButton 
                  styleType="solid" 
                  colorScheme="primary" 
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || isCreating}
                >
                  {isCreating ? 'Creando...' : 'Crear Grupo'}
                </StandardButton>
              </div>
            </div>
          </StandardPopupWindow.Footer>
        </StandardPopupWindow.Content>
      </StandardPopupWindow>

      {/* Diálogo de advertencia para grupo público */}
      <StandardDialog open={showPublicWarning} onOpenChange={setShowPublicWarning}>
        <StandardDialog.Content size="sm" colorScheme="warning">
          <StandardDialog.Header>
            <StandardDialog.Title>⚠️ Confirmar Grupo Público</StandardDialog.Title>
            <StandardDialog.Description>
              Estás a punto de crear un grupo público visible para todo el equipo.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Body>
            <div className="space-y-3">
              <StandardText size="sm" className="text-gray-600 dark:text-gray-400">
                Un grupo público significa que:
              </StandardText>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                <li>Todos los miembros del equipo podrán verlo</li>
                <li>Aparecerá en las vistas compartidas del proyecto</li>
                <li>Otros miembros podrán agregar artículos al grupo</li>
                <li>Podrás cambiarlo a privado más tarde si lo deseas</li>
              </ul>
            </div>
          </StandardDialog.Body>
          <StandardDialog.Footer>
            <StandardButton 
              styleType="outline" 
              colorScheme="neutral" 
              onClick={cancelPublicGroupFromWarning}
              disabled={isCreating}
            >
              Cancelar
            </StandardButton>
            <StandardButton 
              styleType="solid" 
              colorScheme="warning" 
              onClick={confirmPublicGroupFromWarning}
              disabled={isCreating}
            >
              {isCreating ? 'Creando...' : 'Sí, crear grupo público'}
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

      {/* Diálogo de cierre sin guardar */}
      <StandardDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <StandardDialog.Content size="sm">
          <StandardDialog.Header>
            <StandardDialog.Title>Cambios sin Guardar</StandardDialog.Title>
            <StandardDialog.Description>
              Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton 
              styleType="outline" 
              onClick={cancelClose}
            >
              Cancelar
            </StandardButton>
            <StandardButton 
              styleType="solid" 
              colorScheme="primary" 
              onClick={confirmClose}
            >
              Cerrar sin Guardar
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </>
  );
};
