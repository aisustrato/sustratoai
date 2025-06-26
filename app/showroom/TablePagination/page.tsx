//. 📍 app/showroom/TablePagination/page.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardWrapper } from '@/components/ui/StandardWrapper';
import { StandardTable } from '@/components/ui/StandardTable';
import { StandardPagination } from '@/components/ui/StandardPagination';
import { type ColumnDef } from '@tanstack/react-table';
import { StandardCard } from '@/components/ui/StandardCard';

// --- 1. Definición de Datos y Columnas ---

type User = {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'User' | 'Editor';
  status: 'Active' | 'Inactive' | 'Pending';
};

// Generamos una lista grande de datos de ejemplo
const allUsers: User[] = Array.from({ length: 88 }, (_, i) => ({
  id: i + 1,
  name: `Usuario ${i + 1}`,
  email: `usuario${i + 1}@example.com`,
  role: ['Admin', 'User', 'Editor'][i % 3] as User['role'],
  status: ['Active', 'Inactive', 'Pending'][i % 3] as User['status'],
}));

const columns: ColumnDef<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Rol' },
  { accessorKey: 'status', header: 'Estado' },
];

// --- 2. Componente de la Página ---

export default function TablePaginationShowroomPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(allUsers.length / ITEMS_PER_PAGE);

  // Cortamos los datos para la página actual
  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return allUsers.slice(start, end);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <StandardWrapper>
      <StandardPageTitle
        title="Showroom: StandardTable con Paginación"
        description="Demostración de cómo integrar StandardTable con StandardPagination para manejar grandes conjuntos de datos."
      />

      <StandardCard className="mt-8 p-0 overflow-hidden">
        <StandardTable data={currentPageData} columns={columns}>
          <StandardTable.Table />
        </StandardTable>
      </StandardCard>

      <StandardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={allUsers.length}
        itemsPerPage={ITEMS_PER_PAGE}
        className="mt-4"
      />
    </StandardWrapper>
  );
}
