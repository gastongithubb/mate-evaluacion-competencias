#!/bin/bash

# Script para subir el proyecto a GitHub
# Ejecuta: bash subir-github.sh

echo "🚀 Subiendo proyecto MATE a GitHub..."

# Verificar si ya está autenticado
if ! gh auth status &>/dev/null; then
    echo "⚠️  Necesitas autenticarte en GitHub primero"
    echo "Ejecutando: gh auth login"
    gh auth login
fi

# Crear repositorio privado y subir código
echo "📦 Creando repositorio privado en GitHub..."
gh repo create mate-evaluacion-competencias \
    --private \
    --description "Sistema de evaluación de competencias MATE con IA generativa" \
    --source=. \
    --remote=origin \
    --push

if [ $? -eq 0 ]; then
    echo "✅ ¡Repositorio creado y código subido exitosamente!"
    echo "🔗 URL: https://github.com/$(gh api user --jq .login)/mate-evaluacion-competencias"
else
    echo "❌ Error al crear el repositorio"
    exit 1
fi

