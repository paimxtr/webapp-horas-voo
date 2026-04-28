#!/bin/sh
set -e

echo "Aplicando migrações da base de dados..."
npx prisma db push --skip-generate 2>&1 || echo "AVISO: prisma db push falhou, tentando continuar..."

echo "Iniciando a aplicação..."
exec node server.js
