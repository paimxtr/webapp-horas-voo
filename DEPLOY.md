# Guia de Deploy — Webapp Horas de Voo

Este documento descreve como fazer o deploy da aplicação em produção.
São apresentados dois métodos: Railway.app (recomendado) e Docker Compose num VPS.

---

## Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | URL de ligação PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | URL pública da aplicação (sem barra final) | `https://meu-app.railway.app` |
| `NEXTAUTH_SECRET` | Segredo para assinar tokens JWT (mín. 32 chars) | ver instruções abaixo |

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```
Copie o resultado e use como valor de `NEXTAUTH_SECRET`.

---

## Método A — Deploy no Railway (recomendado)

O Railway.app é a forma mais simples de fazer deploy: basta ligar o repositório, criar um serviço PostgreSQL e configurar as variáveis de ambiente. As migrações são aplicadas automaticamente ao iniciar o contentor.

### Pré-requisitos
- Conta gratuita em [railway.app](https://railway.app)
- Código no GitHub / GitLab (ou upload direto via Railway CLI)

### Passos

#### 1. Criar o projecto no Railway

1. Aceda a [railway.app/new](https://railway.app/new) e clique em **"Deploy from GitHub repo"**.
2. Autorize o Railway a aceder ao repositório e selecione-o.

#### 2. Adicionar PostgreSQL

1. No painel do projecto, clique em **"+ New"** → **"Database"** → **"Add PostgreSQL"**.
2. O Railway cria automaticamente a base de dados e disponibiliza a variável `DATABASE_URL`.

#### 3. Ligar a base de dados ao serviço da app

1. No serviço da aplicação, vá a **"Variables"**.
2. Clique em **"+ Add Reference"** e selecione a variável `DATABASE_URL` do serviço PostgreSQL.
   O Railway preenche o valor automaticamente.

#### 4. Configurar as restantes variáveis

No separador **"Variables"** do serviço da aplicação, adicione:

```
NEXTAUTH_URL=https://<dominio-gerado>.railway.app
NEXTAUTH_SECRET=<resultado do openssl rand -base64 32>
```

> Substitua `<dominio-gerado>` pelo domínio atribuído pelo Railway (visível em **Settings → Domains**).

#### 5. Fazer deploy

O Railway deteta o `Dockerfile` e faz o build automaticamente ao fazer push para o repositório.
O `entrypoint.sh` aplica as migrações (`prisma migrate deploy`) antes de iniciar o servidor.

Acompanhe o progresso em **"Deployments"**. Quando o estado ficar **"Active"**, a aplicação está online.

#### 6. Carregar dados iniciais (seed)

Após o primeiro deploy, execute o seed para criar o utilizador Comandante e os dados de exemplo:

```bash
# Via Railway CLI (instalar com: npm i -g @railway/cli)
railway run npm run db:seed
```

Ou abra uma shell no Railway → serviço da app → **"Shell"** e execute:
```bash
npm run db:seed
```

#### 7. Aceder à aplicação

- URL: o domínio mostrado em **Settings → Domains** (ex: `https://webapp-horas-voo.railway.app`)
- Login inicial: `antonio` / `commander123`
- **Altere a password imediatamente após o primeiro acesso.**

---

## Método B — Deploy com Docker Compose num VPS

Use este método se preferir alojar a aplicação num servidor próprio (ex: DigitalOcean, Hetzner, OVH).

### Pré-requisitos
- Servidor Linux com Docker e Docker Compose instalados
- Acesso SSH ao servidor

### Passos

#### 1. Clonar o repositório no servidor

```bash
git clone https://github.com/<seu-utilizador>/webapp-horas-voo.git
cd webapp-horas-voo
```

#### 2. Criar o ficheiro `.env`

```bash
cp .env.example .env
nano .env   # ou: vim .env
```

Edite os valores:
```env
DATABASE_URL=postgresql://horas:SENHA_FORTE@db:5432/horas_voo
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=<resultado do openssl rand -base64 32>
POSTGRES_USER=horas
POSTGRES_PASSWORD=SENHA_FORTE
POSTGRES_DB=horas_voo
```

> Use uma password forte para `POSTGRES_PASSWORD` e o mesmo valor no `DATABASE_URL`.

#### 3. Construir e iniciar os contentores

```bash
docker compose up -d --build
```

O comando:
- Faz o build da imagem da aplicação
- Inicia o PostgreSQL
- Inicia a aplicação (as migrações são aplicadas automaticamente)

#### 4. Verificar que tudo está a funcionar

```bash
# Ver logs da aplicação
docker compose logs -f app

# Verificar estado dos contentores
docker compose ps

# Testar o endpoint de health check
curl http://localhost:3000/api/health
```

Deve receber: `{"status":"ok","timestamp":"..."}`

#### 5. Carregar dados iniciais (seed)

```bash
docker compose exec app node -e "require('child_process').execSync('npm run db:seed', {stdio:'inherit'})"
```

Ou de forma mais simples:
```bash
docker compose exec app sh -c "npm run db:seed"
```

#### 6. Configurar reverse proxy (nginx)

Recomenda-se usar o nginx na frente da aplicação. Exemplo de configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name seu-dominio.com;

    ssl_certificate     /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Use o [Certbot](https://certbot.eff.org/) para obter certificado SSL gratuito (Let's Encrypt).

#### 7. Aceder à aplicação

- URL: `https://seu-dominio.com`
- Login inicial: `antonio` / `commander123`
- **Altere a password imediatamente após o primeiro acesso.**

---

## Actualizar a aplicação

### Railway
Basta fazer `git push` para o repositório. O Railway faz o re-deploy automaticamente.

### Docker Compose (VPS)
```bash
git pull
docker compose up -d --build
```
O `entrypoint.sh` aplica automaticamente as novas migrações ao reiniciar.

---

## Notas de Segurança

- Nunca cometa o ficheiro `.env` no repositório (já está no `.gitignore`).
- Use sempre um `NEXTAUTH_SECRET` aleatório e com pelo menos 32 caracteres.
- Em produção, o servidor rejeita o arranque se `NEXTAUTH_SECRET` não estiver definido.
- Altere as passwords dos utilizadores de exemplo (`antonio`, `manuel`, `paulo`) após o primeiro acesso.
- Mantenha o servidor e as imagens Docker actualizadas.

---

## Resolução de Problemas

| Problema | Causa provável | Solução |
|---|---|---|
| `Error: NEXTAUTH_SECRET deve estar definido` | Variável não configurada | Adicione `NEXTAUTH_SECRET` nas variáveis de ambiente |
| `Can't reach database server` | DATABASE_URL incorrecta ou PostgreSQL não iniciado | Verifique a URL e o estado do serviço de base de dados |
| Página em branco após login | `NEXTAUTH_URL` incorrecta | Defina `NEXTAUTH_URL` com o domínio correcto |
| `prisma migrate deploy` falha | Migrações em conflito | Verifique os logs e resolva conflitos manualmente |
