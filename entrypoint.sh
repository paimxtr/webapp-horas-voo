#!/bin/sh
set -e

echo "Aplicando migrações da base de dados..."
npx prisma migrate deploy

echo "Iniciando a aplicação..."
exec node server.js
