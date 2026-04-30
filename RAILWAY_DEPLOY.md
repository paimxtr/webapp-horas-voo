# 🚂 DEPLOY NO RAILWAY - GUia RÁPIDO

## ✅ O que está preparado

O projeto já está configurado para deploy no Railway com:
- ✅ PostgreSQL (dados persistentes)
- ✅ Docker (container otimizado)
- ✅ Health checks
- ✅ Auto-restart

---

## 🚀 COMO FAZER DEPLOY (quando tiver cartão)

### Passo 1: Criar conta no Railway
1. Vá a https://railway.app
2. Clique "Get Started"
3. Faça login com GitHub
4. Adicione método de pagamento (cartão de crédito/débito)
5. Ative o plano Starter ($5/mês)

### Passo 2: Criar projeto
1. No Railway dashboard, clique **"New Project"**
2. Escolha **"Deploy from GitHub repo"**
3. Selecione: `paimxtr/webapp-horas-voo`
4. Clique **"Add Variables"**

### Passo 3: Adicionar PostgreSQL
1. Clique **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. O Railway cria automaticamente a variável `DATABASE_URL`

### Passo 4: Configurar variáveis de ambiente
Clique no serviço da app → **"Variables"** → **"New Variable"**:

| Variável | Valor |
|----------|-------|
| `NEXTAUTH_SECRET` | `K7x9mP2vQwR4tY8uN3bF6hJ1dL5sA0eC9gW2xZ4kM` |
| `NEXTAUTH_URL` | `https://webapp-horas-voo.up.railway.app` (o Railway gera isto) |

### Passo 5: Deploy automático
1. O Railway faz build automaticamente
2. Aguarde 2-3 minutos
3. Quando aparecer "Active", clique **"Deploy Logs"**
4. Verifique se o build foi bem-sucedido

### Passo 6: Seed da base de dados
1. Clique no serviço → **"Shell"**
2. Execute: `npm run db:seed`
3. Os dados iniciais serão criados

### Passo 7: Aceder ao app
1. Vá a **"Settings"** → **"Networking"**
2. Clique **"Generate Domain"**
3. O seu link estará pronto!

---

## 💰 CUSTOS

- **Railway Starter**: $5/mês (inclui PostgreSQL + app)
- **Dados**: Persistem mesmo se reiniciar
- **Tráfego**: Incluído no plano

---

## 🔑 CREDENCIAIS PÓS-DEPLOY

| Perfil | Login | Senha |
|--------|-------|-------|
| Comandante | antonio | commander123 |
| Tripulante 1 | carlos.mendes | crew123 |
| Tripulante 2 | maria.santos | crew123 |

---

## 🆘 SE PRECISAR DE AJUDA

Contacte o desenvolvedor ou consulte:
- Docs Railway: https://docs.railway.app
- Suporte: https://railway.app/help

---

**Vigilância, Presença, Soberania** 🛡️
