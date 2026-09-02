"use client";

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
import { Plus, Lock, Globe, Users, FolderPlus, CheckCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';

interface ArticleGroupManagerSimpleProps {
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

export default function ArticleGroupManagerSimple({ 
  articleId, 
  hasGroups = false, 
  isLoadingPresence = false, 
  onGroupsChanged 
}: ArticleGroupManagerSimpleProps) {
  const t = useTranslations('articulos.articleGroupManagerSimple');
  const [menuData, setMenuData] = useState<{
    articleId: string;
    allGroups: GroupWithArticleCount[];
    articleGroups: GroupWithArticleCount[];
    availableGroups: GroupWithArticleCount[];
  } | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
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
      toast.error(t('invalidArticle'));
      return;
    }

    setIsLoadingMenu(true);
    try {
      const allGroupsResult = await getGroups({ articleId });

      if (!allGroupsResult.success) {
        toast.error(t('errorLoadingGroups'));
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
      toast.error(t('errorUnexpectedLoading'));
    } finally {
      setIsLoadingMenu(false);
    }
  }, [articleId, t]);
  
  const handleMenuOpenChange = (open: boolean) => {
    if (open) {
      setMenuOpen(true);
      setIsDropdownOpen(true);
      if (!menuData) {
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
        toast.success(t('toastArticleAddedToGroup', { groupName: selectedGroupForAdd.name }));
        setShowAddConfirm(false);
        setSelectedGroupForAdd(null);
        setMenuOpen(false);
        setIsDropdownOpen(false);

        onGroupsChanged?.(true);
      } else {
        toast.error(t('toastErrorAdding', { message: result.error }));
      }
    } catch {
      toast.error(t('toastUnexpectedAdding'));
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
        toast.error(t('toastErrorLoadingDetails', { message: result.error }));
        setGroupDetails(null);
      }
    } catch {
      toast.error(t('toastUnexpectedLoadingDetails'));
      setGroupDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const groupArticlesColumns: ColumnDef<GroupArticleData>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: t('columnArticleTitle'),
      size: 300,
      meta: { isTruncatable: true },
    },
    {
      id: "description",
      accessorKey: "description",
      header: t('columnDescription'),
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
            {t('noDescription')}
          </StandardText>
        );
      },
    },
  ];

  const groupArticlesData: GroupArticleData[] = groupDetails?.items.map((item) => ({
    id: item.article_id,
    title: item.article_title || t('untitled'),
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
            size="sm"
            tooltip={hasGroups ? t('tooltipManageGroups') : t('tooltipAssignGroups')}
            disabled={isLoadingMenu || isLoadingPresence}
          >
            {isLoadingPresence ? (
              <SustratoLoadingLogo size={16} variant="spin" speed="fast" />
            ) : (
              <Users size={16} />
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
                text={t('loadingGroups')}
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
                      <StandardDropdownMenu.Item disabled>{t('alreadyInAllGroups')}</StandardDropdownMenu.Item>
                    )}
                    <StandardDropdownMenu.Separator />
                    <StandardDropdownMenu.Item onSelect={() => setShowCreateGroup(true)} className="flex items-center gap-2">
                      <StandardIcon size="xs" styleType="outline" colorScheme="primary"><Plus /></StandardIcon>
                      {t('createNewGroup')}
                    </StandardDropdownMenu.Item>
                  </>
                }
              >
                <span className="flex items-center gap-2">
                  <StandardIcon size="xs" styleType="outline" colorScheme="primary"><FolderPlus /></StandardIcon>
                  {t('tooltipAssignGroups')}
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
                    {t('groupsWhereItIs')}
                  </span>
                </StandardDropdownMenu.SubMenuItem>
              )}
            </>
          ) : (
            <div className="px-3 py-4 text-center">
              <StandardText size="sm" colorShade="subtle">{t('errorLoadingData')}</StandardText>
            </div>
          )}
        </StandardDropdownMenu.Content>
      </StandardDropdownMenu>

      <StandardDialog open={showAddConfirm} onOpenChange={setShowAddConfirm}>
        <StandardDialog.Content size="sm">
          <StandardDialog.Header>
            <StandardDialog.Title>{t('confirmAddTitle')}</StandardDialog.Title>
            <StandardDialog.Description>
              {t('confirmAddDescription', { groupName: selectedGroupForAdd?.name ?? '' })}
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" onClick={() => setShowAddConfirm(false)} disabled={isAdding}>{t('cancelButton')}</StandardButton>
            <StandardButton styleType="solid" colorScheme="primary" onClick={handleAddToGroup} disabled={isAdding}>
              {isAdding ? t('addingButton') : t('addToGroupButton')}
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

      <StandardPopupWindow open={showGroupDetails} onOpenChange={setShowGroupDetails}>
         <StandardPopupWindow.Content size="lg">
           <StandardPopupWindow.Header>
             <StandardPopupWindow.Title>
               {t('groupDetailsTitle', { groupName: selectedGroupForDetails?.name ?? '' })}
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
                   {t('groupSummary', {
                     visibility: selectedGroupForDetails?.visibility === 'public' ? t('publicGroupLabel') : t('privateGroupLabel'),
                     count: selectedGroupForDetails?.article_count ?? 0,
                   })}
                 </StandardText>
               </div>
             </StandardPopupWindow.Description>
           </StandardPopupWindow.Header>

           <StandardPopupWindow.Body className="space-y-4">
             {groupDetails?.description && (
               <div>
                 <StandardText size="sm" weight="semibold" className="mb-2">
                   {t('descriptionLabel')}
                 </StandardText>
                 <StandardText size="sm" colorShade="subtle">
                   {groupDetails.description}
                 </StandardText>
               </div>
             )}

             <div>
               <StandardText size="sm" weight="semibold" className="mb-3">
                 {t('articlesInGroupLabel')}
               </StandardText>
               {isLoadingDetails ? (
                 <div className="flex justify-center py-8">
                   <StandardText size="sm" colorShade="subtle">
                     {t('loadingArticles')}
                   </StandardText>
                 </div>
               ) : groupArticlesData.length > 0 ? (
                 <StandardTable
                   data={groupArticlesData}
                   columns={groupArticlesColumns}
                   enableTruncation={true}
                   filterPlaceholder={t('searchArticlesPlaceholder')}
                 >
                   <StandardTable.Table />
                 </StandardTable>
               ) : (
                 <StandardText size="sm" colorShade="subtle" className="italic text-center py-4">
                   {t('noArticlesInGroup')}
                 </StandardText>
               )}
             </div>
           </StandardPopupWindow.Body>

           <StandardPopupWindow.Footer>
             <StandardButton
               styleType="outline"
               onClick={() => setShowGroupDetails(false)}
             >
               {t('closeButton')}
             </StandardButton>
           </StandardPopupWindow.Footer>
         </StandardPopupWindow.Content>
       </StandardPopupWindow>

      <CreateGroupPopup
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        articleId={articleId}
        onCreated={() => {
          onGroupsChanged?.(true);
          setMenuOpen(false);
          setIsDropdownOpen(false);
        }}
      />
    </>
  );
}
