#!/bin/bash

# Dieses Skript ersetzt alle Vorkommen von createServerSupabaseClient durch createPagesServerClient
# in den API-Dateien des Projekts

# 1. Ersetze die Importe
find src/pages/api -type f -name "*.ts" -exec sed -i '' 's/import { createServerSupabaseClient } from '"'"'@supabase\/auth-helpers-nextjs'"'"';/import { createPagesServerClient } from '"'"'@supabase\/auth-helpers-nextjs'"'"';/g' {} \;

# 2. Ersetze die Funktionsaufrufe
find src/pages/api -type f -name "*.ts" -exec sed -i '' 's/createServerSupabaseClient(/createPagesServerClient(/g' {} \;

# 3. Ersetze auch in den Seiten-Komponenten (für getServerSideProps)
find src/pages -type f -name "*.tsx" -exec sed -i '' 's/import { createServerSupabaseClient } from '"'"'@supabase\/auth-helpers-nextjs'"'"';/import { createPagesServerClient } from '"'"'@supabase\/auth-helpers-nextjs'"'"';/g' {} \;
find src/pages -type f -name "*.tsx" -exec sed -i '' 's/createServerSupabaseClient(/createPagesServerClient(/g' {} \;

echo "Aktualisierung abgeschlossen. Bitte überprüfen Sie die Änderungen und starten Sie den Entwicklungsserver neu."
