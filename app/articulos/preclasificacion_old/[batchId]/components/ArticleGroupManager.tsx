"use client";

import React, { useState, useCallback } from 'react';
import { StandardDropdownMenu } from '@/components/ui/StandardDropdownMenu';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardDialog } from '@/components/ui/StandardDialog';
import { StandardPopupWindow } from '@/components/ui/StandardPopupWindow';
import { StandardText } from '@/components/ui/StandardText';
import { StandardIcon } from '@/components/ui/StandardIcon';
import { StandardTable } from '@/components/ui/StandardTable';
import CreateGroupPopup from '@/app/articulos/grupos/CreateGroupPopup';
import { toast } from 'sonner';
import { 
  getGroups, 
  getGroupDetails,
  addArticlesToGroup, 
  type GroupWithArticleCount,
  type GroupDetails,
} from '@/lib/actions/article-group-actions';
import { useAuth } from '@/app/auth-provider';
import { Plus, Lock, Globe, MapPin, FolderPlus, CheckCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';

interface ArticleGroupManagerProps {
  articleId: string;
  hasGroups?: boolean; 
  isLoadingPresence?: boolean;
  onGroupsChanged?: (hasGroups: boolean) => void;
}

interface GroupArticleData {
  id: string;
  title: string;
  description?: string;
}

export default function ArticleGroupManager({ articleId, hasGroups = false, isLoadingPresence = false, onGroupsChanged }: ArticleGroupManagerProps) {
  const [menuData, setMenuData] = useState<{
    articleId: string;
    allGroups: GroupWithArticleCount[];
    articleGroups: GroupWithArticleCount[];
    availableGroups: GroupWithArticleCount[];
  } | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Estado local para feedback visual
  
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<GroupWithArticleCount | null>(null);
  const [selectedGroupForDetails, setSelectedGroupForDetails] = useState<GroupWithArticleCount | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const { user } = useAuth();
  
  const loadMenuData = useCallback(async () => {
    if (!articleId) {
      toast.error('Artículo no válido');
      return;
    }
    
    setIsLoadingMenu(true);
    try {
      const allGroupsResult = await getGroups({ articleId });

      if (!allGroupsResult.success) {
        toast.error('Error al cargar grupos');
        return;
      }
      
      const allGroupsData = allGroupsResult.data || [];
      const articleGroupsData = allGroupsData.filter(g => g.article_count > 0);
      const availableGroupsData = allGroupsData.filter(g => g.article_count === 0);
      
      setMenuData({
        articleId,
        allGroups: allGroupsData,
        articleGroups: articleGroupsData,
        availableGroups: availableGroupsData
      });
      
    } catch {
      toast.error('Error inesperado al cargar datos');
    } finally {
      setIsLoadingMenu(false);
    }
  }, [articleId]);
  
  const handleMenuOpenChange = (open: boolean) => {
    // Abrir/cerrar menú inmediatamente para feedback instantáneo
    if (open) {
      setMenuOpen(true);
      setIsDropdownOpen(true);
      if (!menuData) {
        // Cargar datos en segundo plano
        setIsLoadingMenu(true);
        loadMenuData();
      }
    } else {
      setMenuOpen(false);
      setIsDropdownOpen(false);
    }
  };

  const handleSelectGroupToAdd = (group: GroupWithArticleCount) => {
    setSelectedGroupForAdd(group);
    setShowAddConfirm(true);
  };

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
        setMenuOpen(false);
        setIsDropdownOpen(false); // Resetear estado visual
        
        // 🔄 CRÍTICO: Notificar al componente padre que ahora tiene grupos
        onGroupsChanged?.(true);
      } else {
        toast.error(`Error al agregar artículo: ${result.error}`);
      }
    } catch {
      toast.error('Error inesperado al agregar artículo');
    } finally {
      setIsAdding(false);
    }
  };

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
    } catch {
      toast.error('Error inesperado al cargar detalles del grupo');
      setGroupDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Crear grupo: se maneja con CreateGroupPopup

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

  const groupArticlesData: GroupArticleData[] = groupDetails?.items.map((item) => ({
    id: item.article_id,
    title: item.article_title || "Sin título",
    description: item.description || undefined,
  })) || [];

  return (
    <>
      <StandardDropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
        <StandardDropdownMenu.Trigger asChild>
          <StandardButton
            styleType={isDropdownOpen ? "subtle" : (hasGroups ? "solid" : "outline")}
            colorScheme={hasGroups ? "accent" : undefined}
            iconOnly={true}
            tooltip={hasGroups ? "Ver/gestionar grupos" : "Asignar a grupos"}
            disabled={isLoadingMenu || isLoadingPresence}
          >
            {isLoadingPresence ? (
              <SustratoLoadingLogo size={16} variant="spin" speed="fast" />
            ) : (
              <MapPin size={16} />
            )}
          </StandardButton>
        </StandardDropdownMenu.Trigger>
        
        <StandardDropdownMenu.Content align="end" className="w-64" submenusSide="left">
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
              <StandardDropdownMenu.SubMenuItem
                submenuContent={
                  <>
                    {menuData.availableGroups.length > 0 ? (
                      menuData.availableGroups.map((group) => (
                        <StandardDropdownMenu.Item key={group.id} onSelect={() => handleSelectGroupToAdd(group)} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StandardIcon size="xs" styleType="outline" colorScheme={group.visibility === 'public' ? 'primary' : 'neutral'}>
                              {group.visibility === 'public' ? <Globe /> : <Lock />}
                            </StandardIcon>
                            <span className="truncate">{group.name}</span>
                          </div>
                          <StandardText size="xs" colorShade="subtle">({group.article_count})</StandardText>
                        </StandardDropdownMenu.Item>
                      ))
                    ) : (
                      <StandardDropdownMenu.Item disabled>Ya está en todos los grupos</StandardDropdownMenu.Item>
                    )}
                    <StandardDropdownMenu.Separator />
                    <StandardDropdownMenu.Item onSelect={() => setShowCreateGroup(true)} className="flex items-center gap-2">
                      <StandardIcon size="xs" styleType="outline" colorScheme="primary"><Plus /></StandardIcon>
                      Crear nuevo grupo
                    </StandardDropdownMenu.Item>
                  </>
                }
              >
                <span className="flex items-center gap-2">
                  <StandardIcon size="xs" styleType="outline" colorScheme="primary"><FolderPlus /></StandardIcon>
                  Asignar a grupos
                </span>
              </StandardDropdownMenu.SubMenuItem>
              
              {menuData.articleGroups.length > 0 && (
                <StandardDropdownMenu.SubMenuItem
                  submenuContent={
                    <>
                      {menuData.articleGroups.map((group) => (
                        <StandardDropdownMenu.Item key={group.id} onSelect={() => handleSelectGroupToView(group)} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StandardIcon size="xs" styleType="outline" colorScheme={group.visibility === 'public' ? 'primary' : 'neutral'}>
                              {group.visibility === 'public' ? <Globe /> : <Lock />}
                            </StandardIcon>
                            <span className="truncate">{group.name}</span>
                          </div>
                          <StandardText size="xs" colorShade="subtle">({group.article_count})</StandardText>
                        </StandardDropdownMenu.Item>
                      ))}
                    </>
                  }
                >
                  <span className="flex items-center gap-2">
                    <StandardIcon size="xs" styleType="outline" colorScheme="success"><CheckCircle /></StandardIcon>
                    Grupos donde está
                  </span>
                </StandardDropdownMenu.SubMenuItem>
              )}
            </>
          ) : (
            <div className="px-3 py-4 text-center">
              <StandardText size="sm" colorShade="subtle">Error al cargar datos</StandardText>
            </div>
          )}
        </StandardDropdownMenu.Content>
      </StandardDropdownMenu>

      <StandardDialog open={showAddConfirm} onOpenChange={setShowAddConfirm}>
        <StandardDialog.Content size="sm">
          <StandardDialog.Header>
            <StandardDialog.Title>Confirmar Adición al Grupo</StandardDialog.Title>
            <StandardDialog.Description>
              ¿Estás seguro de que quieres agregar este artículo al grupo &ldquo;{selectedGroupForAdd?.name}&rdquo;?
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" onClick={() => setShowAddConfirm(false)} disabled={isAdding}>Cancelar</StandardButton>
            <StandardButton styleType="solid" colorScheme="primary" onClick={handleAddToGroup} disabled={isAdding}>
              {isAdding ? 'Agregando...' : 'Agregar al Grupo'}
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

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
                   Grupo {selectedGroupForDetails?.visibility === "public" ? "público" : "privado"} • {selectedGroupForDetails?.article_count} artículo{selectedGroupForDetails?.article_count !== 1 ? "s" : ""}
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
                 // 📌 FIX: Se restaura el hijo <StandardTable.Table />
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

      {/* Popup de creación de grupo reutilizable */}
      <CreateGroupPopup
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        articleId={articleId}
        onCreated={() => {
          // Notificar presencia y cerrar menús
          onGroupsChanged?.(true);
          setMenuOpen(false);
          setIsDropdownOpen(false);
        }}
      />
    </>
  );
};