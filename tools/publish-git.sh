#!/usr/bin/env bash
# Publica o projeto no GitHub a partir do Ubuntu (WSL):
#  - branch main: código-fonte (src, tools, migration, docs), sem dist/ nem node_modules
#  - branch demo: conteúdo de dist/demo (site estático da demonstração, que o cPanel despliega em /demo-airam/)
# Uso: bash tools/publish-git.sh /mnt/c/.../airam-dental "mensagem do commit"
set -euo pipefail
SRC="$1"; MSG="${2:-Actualización}"
REPO=~/airam-dental
DEMO=~/airam-dental-demo
[ -f "$SRC/dist/demo/index.html" ] || { echo "falta dist/demo"; exit 1; }

# --- main: código-fonte ---
cd "$REPO"
git checkout -q main
git pull -q --ff-only origin main
# remove arquivos rastreados que não existem mais na fonte (estrutura antiga plana), mantendo .git
git ls-files -z | xargs -0 -r rm -f
find . -mindepth 1 -type d -not -path './.git*' -empty -delete 2>/dev/null || true
tar -C "$SRC" --exclude=./node_modules --exclude=./dist --exclude=./.cache --exclude=./.claude -cf - . | tar -xf -
git add -A
git commit -q -m "$MSG" || echo "main: sin cambios"
git push -q origin main

# --- demo: site gerado ---
if [ ! -d "$DEMO/.git" ]; then git clone -q --branch demo git@github.com:alessandrobarbo/airam-dental.git "$DEMO"; fi
cd "$DEMO"
git checkout -q demo
git pull -q --ff-only origin demo
git ls-files -z | xargs -0 -r rm -f
find . -mindepth 1 -type d -not -path './.git*' -empty -delete 2>/dev/null || true
cp -r "$SRC/dist/demo/." .
git add -A
git commit -q -m "Demo: $MSG" || echo "demo: sin cambios"
git push -q origin demo
echo "---"
git -C "$REPO" log --oneline -1
git -C "$DEMO" log --oneline -1
git ls-remote origin
echo "demo files: $(git -C "$DEMO" ls-files | wc -l)"
