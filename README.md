# front-gerenciamento (Frontend)

Frontend do sistema de gestão financeira multiempresa: React 19 + Vite +
TypeScript + Tailwind. Consome a API do repositório
[sistema-gerenciamento](https://github.com/ivan19rx/sistema-gerenciamento).

| Onde | Como roda |
| --- | --- |
| Local | `npm run dev` → http://localhost:5173 |
| Produção | Vercel, deploy automático a cada push na branch `main` |
| API usada | definida em `VITE_API_BASE_URL` |

---

## 1. Primeira vez (máquina nova ou clone novo)

```bash
npm install
```

Crie o `.env` a partir do modelo:

```bash
cp .env.example .env
```

O `.env` tem uma única variável:

```
VITE_API_BASE_URL=http://localhost:9090
```

- `http://localhost:9090` → usa a API rodando na sua máquina (`npm run dev` no
  `sistema-gerenciamento`).
- URL do Render → usa a API de produção (útil para testar só o visual, mas
  **os dados são os reais**).

Suba o front:

```bash
npm run dev
```

> Variáveis `VITE_*` são lidas quando o Vite inicia. Se mudar o `.env`, pare e
> rode `npm run dev` de novo.

---

## 2. Comandos do dia a dia

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com recarga automática (porta 5173) |
| `npm run build` | Confere os tipos (`tsc -b`) e gera a versão final em `dist/` |
| `npm run preview` | Serve o `dist/` localmente para testar a versão final |
| `npm run lint` | Procura problemas de código com o ESLint |
| `npx tsc -b` | Só confere os tipos, sem gerar o build |

O aviso *"Some chunks are larger than 500 kB"* no build é normal e não impede o deploy.

---

## 3. Quando você alterar o frontend

### Caso A: mudou telas, componentes ou estilos

1. Teste com `npm run dev`.
2. Confira se o build passa (é o mesmo que a Vercel vai rodar):
   ```bash
   npm run build
   ```
3. Envie:
   ```bash
   git add .
   git commit -m "descrição da mudança"
   git push
   ```
4. A Vercel publica sozinha em ~1 minuto. Acompanhe em vercel.com → projeto →
   **Deployments**.

Se o build falhar na Vercel, rode `npm run build` na sua máquina: o erro é o mesmo.

### Caso B: a mudança depende de uma alteração na API

Ex.: tela nova que usa uma rota nova, campo novo vindo da API.

1. Rode a API local (`npm run dev` no `sistema-gerenciamento`) com
   `VITE_API_BASE_URL=http://localhost:9090` no `.env` do front.
2. Desenvolva e teste as duas partes juntas.
3. Publique **primeiro a API** (push no `sistema-gerenciamento` e espere o
   deploy do Render terminar). Veja o README da API, principalmente se mudou o
   banco.
4. Depois publique o front (passo a passo do caso A).

Se o front for publicado antes, ele vai chamar algo que a API em produção ainda
não tem e a tela mostra erro.

### Caso C: mudou só a API, sem mudar o que o front envia ou recebe

Nada a fazer no front.

### Caso D: atualizou dependências

```bash
npm install
npm run build
git add package.json package-lock.json
git commit -m "atualiza dependências"
git push
```

### Caso E: mudou o endereço da API de produção

1. Vercel → projeto → **Settings → Environment Variables** → edite
   `VITE_API_BASE_URL`.
2. **Faça um redeploy** (Deployments → último deploy → **⋯ → Redeploy**). A
   variável entra no build, então salvar sozinho não basta.
3. Confira se o novo domínio do front está em `CORS_ORIGINS` na API (Render).

### Caso F: mudou o domínio do front

Adicione o novo domínio em `CORS_ORIGINS` nas variáveis da API no Render, senão
o navegador bloqueia as requisições (erro de CORS).

---

## 4. Deploy na Vercel (referência)

- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Variável:** `VITE_API_BASE_URL` = URL da API no Render
- **Auto-Deploy:** a cada push na `main`

O `vercel.json` manda todas as rotas para o `index.html`. Sem ele, recarregar a
página em `/lancamentos` ou `/admin` dá 404. **Não apague esse arquivo.**

---

## 5. Onde fica cada coisa

| Pasta / arquivo | Conteúdo |
| --- | --- |
| `src/pages/` | Telas (Dashboard, Lançamentos, Movimentações, Extrato…) |
| `src/pages/admin/` | Telas do administrador |
| `src/components/` | Componentes reutilizáveis (tabela, modal, calendário, menu) |
| `src/auth/` | Login, token e chamadas à API (`api.ts`) |
| `src/hooks/` | `useFetch` (busca com cache) e `useCrud` (telas de cadastro) |
| `src/utils/relatorio*.ts` | Relatórios em PDF (gerados no navegador) |
| `src/theme.ts` | Cores do sistema |

---

## 6. Problemas comuns

| Sintoma | Causa provável / solução |
| --- | --- |
| "Não foi possível conectar ao servidor" | API fora do ar, ou acordando no Render (aguarde ~1 min). Local: a API está rodando? |
| Erro de CORS no console | Origem do front faltando em `CORS_ORIGINS` na API |
| Mudei o `.env` e nada mudou | Reinicie o `npm run dev` |
| Página dá 404 ao recarregar na Vercel | `vercel.json` ausente |
| Front em produção chama a API errada | `VITE_API_BASE_URL` na Vercel + redeploy |
