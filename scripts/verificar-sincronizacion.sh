#!/bin/bash

# 🔍 Script de Verificación Exhaustiva de Sincronización Git
# Compara el repositorio local con GitHub (origin/main)
# Local es la fuente de verdad

echo "🔍 VERIFICACIÓN EXHAUSTIVA DE SINCRONIZACIÓN GIT"
echo "=================================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Actualizar referencias remotas
echo "📡 1. Actualizando referencias del remoto..."
git fetch origin --quiet
echo ""

# 2. Verificar commits pendientes de push
echo "📤 2. Verificando commits locales no pusheados..."
LOCAL_COMMITS=$(git log origin/main..HEAD --oneline)
if [ -z "$LOCAL_COMMITS" ]; then
    echo -e "${GREEN}✅ No hay commits locales pendientes de push${NC}"
else
    echo -e "${YELLOW}⚠️  HAY COMMITS LOCALES NO PUSHEADOS:${NC}"
    echo "$LOCAL_COMMITS"
fi
echo ""

# 3. Verificar si remoto está adelante
echo "📥 3. Verificando si remoto está adelante..."
REMOTE_COMMITS=$(git log HEAD..origin/main --oneline)
if [ -z "$REMOTE_COMMITS" ]; then
    echo -e "${GREEN}✅ Local está al día con remoto${NC}"
else
    echo -e "${RED}⚠️  REMOTO ESTÁ ADELANTE (necesitas hacer pull):${NC}"
    echo "$REMOTE_COMMITS"
fi
echo ""

# 4. Comparar hashes
echo "🔐 4. Comparando hashes de commits..."
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)
echo "   Local:  $LOCAL_HASH"
echo "   Remoto: $REMOTE_HASH"
if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    echo -e "${GREEN}✅ Hashes idénticos - Perfectamente sincronizados${NC}"
else
    echo -e "${YELLOW}⚠️  Hashes diferentes - Hay diferencias${NC}"
fi
echo ""

# 5. Verificar archivos modificados (código)
echo "📝 5. Verificando archivos de código modificados..."
CODE_FILES=$(git status --porcelain | grep -E "\.(ts|tsx|js|jsx|json|md)$" | wc -l | tr -d ' ')
if [ "$CODE_FILES" -eq 0 ]; then
    echo -e "${GREEN}✅ No hay archivos de código modificados${NC}"
else
    echo -e "${YELLOW}⚠️  Hay $CODE_FILES archivos de código modificados:${NC}"
    git status --porcelain | grep -E "\.(ts|tsx|js|jsx|json|md)$"
fi
echo ""

# 6. Verificar TODOS los archivos modificados
echo "📋 6. Listando TODOS los archivos modificados..."
MODIFIED=$(git status --porcelain)
if [ -z "$MODIFIED" ]; then
    echo -e "${GREEN}✅ Working directory limpio${NC}"
else
    echo -e "${YELLOW}Archivos con cambios:${NC}"
    echo "$MODIFIED"
fi
echo ""

# 7. Diferencias con remoto
echo "🔄 7. Diferencias con origin/main..."
DIFF_STAT=$(git diff origin/main --stat)
if [ -z "$DIFF_STAT" ]; then
    echo -e "${GREEN}✅ No hay diferencias con origin/main${NC}"
else
    echo -e "${YELLOW}Diferencias encontradas:${NC}"
    git diff origin/main --stat
fi
echo ""

# 8. Archivos no rastreados
echo "❓ 8. Archivos no rastreados..."
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -z "$UNTRACKED" ]; then
    echo -e "${GREEN}✅ No hay archivos no rastreados${NC}"
else
    echo -e "${BLUE}ℹ️  Archivos no rastreados (pueden ser ignorados):${NC}"
    echo "$UNTRACKED" | head -20
fi
echo ""

# RESUMEN FINAL
echo "=================================================="
echo "📊 RESUMEN FINAL"
echo "=================================================="

if [ -z "$LOCAL_COMMITS" ] && [ -z "$REMOTE_COMMITS" ] && [ "$LOCAL_HASH" = "$REMOTE_HASH" ] && [ "$CODE_FILES" -eq 0 ]; then
    echo -e "${GREEN}✅✅✅ TODO PERFECTAMENTE SINCRONIZADO ✅✅✅${NC}"
    echo ""
    echo "Local y GitHub están 100% sincronizados."
    echo "No hay commits pendientes ni archivos de código modificados."
    echo "Puedes proceder con confianza."
else
    echo -e "${YELLOW}⚠️  ATENCIÓN: Hay elementos que requieren revisión${NC}"
    echo ""
    if [ -n "$LOCAL_COMMITS" ]; then
        echo -e "${YELLOW}• Hay commits locales sin pushear${NC}"
    fi
    if [ -n "$REMOTE_COMMITS" ]; then
        echo -e "${RED}• El remoto está adelante (pull necesario)${NC}"
    fi
    if [ "$CODE_FILES" -gt 0 ]; then
        echo -e "${YELLOW}• Hay $CODE_FILES archivos de código modificados${NC}"
    fi
fi

echo ""
echo "=================================================="
