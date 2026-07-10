import { API_BASE_URL } from '../config'
import { authStore } from './store'

// --- Resiliência a "cold start" ---------------------------------------------
// A API roda no plano gratuito do Render, que hiberna após ~15 min sem tráfego.
// A primeira requisição depois disso precisa "acordar" o container (30–60s) e,
// enquanto ele sobe, o Render costuma devolver 502/503/504 ou derrubar a
// conexão (fetch lança). Sem tratamento, isso vira um erro na tela do usuário.
//
// Por isso reenviamos a requisição algumas vezes, com espera crescente entre
// as tentativas, cobrindo a janela típica de cold start (~30s). Só reenviamos
// em sinais de indisponibilidade temporária — nunca em respostas do app
// (2xx/4xx e demais 5xx, que indicam um resultado real e não devem repetir).

// Status que indicam o serviço reiniciando (não uma resposta do app).
const STATUS_REENVIAVEIS = new Set([502, 503, 504])
// Esperas (ms) entre tentativas. O nº de tentativas = tamanho + 1.
const BACKOFF_MS = [1500, 3000, 5000, 8000, 12000]
// Limite por tentativa: aborta uma conexão pendurada para partir p/ a próxima.
const TIMEOUT_POR_TENTATIVA_MS = 20_000

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// `fetch` com reenvio automático em falha de rede / 502-503-504.
async function fetchComReenvio(url: string, options: RequestInit): Promise<Response> {
  let ultimoErro: unknown
  for (let tentativa = 0; tentativa <= BACKOFF_MS.length; tentativa++) {
    if (tentativa > 0) await sleep(BACKOFF_MS[tentativa - 1])

    // Timeout por tentativa só quando o chamador não controla o abort.
    const controller = options.signal ? null : new AbortController()
    const timer = controller
      ? setTimeout(() => controller.abort(), TIMEOUT_POR_TENTATIVA_MS)
      : null
    try {
      const res = await fetch(url, controller ? { ...options, signal: controller.signal } : options)
      // Serviço subindo: reenvia enquanto houver tentativas restantes.
      if (STATUS_REENVIAVEIS.has(res.status) && tentativa < BACKOFF_MS.length) continue
      return res
    } catch (err) {
      // Falha de rede/timeout (conexão caiu ou serviço acordando): reenvia.
      ultimoErro = err
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
  // Esgotadas as tentativas por falha de rede: erro amigável (o console guarda
  // o original para depuração).
  console.error('Falha ao conectar à API após múltiplas tentativas:', ultimoErro)
  throw new Error('Não foi possível conectar ao servidor. Ele pode estar iniciando — tente novamente em alguns segundos.')
}

// Wrapper único de `fetch` para a API. Anexa automaticamente:
//  - Authorization: Bearer <token>
//  - X-Empresa-Id: <id>  (apenas quando um ADMIN está visualizando uma empresa;
//    a empresa logada é resolvida pelo próprio token no backend)
//
// Em 401 (token ausente/expirado/inválido) faz logout — os guards de rota
// reagem ao estado e redirecionam para /login.
//
// `path` deve começar com '/', ex: apiFetch('/lancamentos').
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { token, role, selectedEmpresa } = authStore.getState()

  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (role === 'ADMIN' && selectedEmpresa) {
    headers.set('X-Empresa-Id', String(selectedEmpresa.id))
  }

  const res = await fetchComReenvio(`${API_BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    authStore.logout()
  }

  return res
}

// Igual ao apiFetch, mas para corpos JSON: define Content-Type e serializa.
export function apiFetchJson(path: string, method: string, body: unknown): Promise<Response> {
  return apiFetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
