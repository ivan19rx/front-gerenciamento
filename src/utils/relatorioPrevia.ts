import { authStore } from '../auth/store'

// Rodapé das janelas de relatório.
//
// O relatório abre como uma prévia: a pessoa confere os dados e só então
// clica em "Imprimir" no final da página (antes a impressão abria sozinha).
// A barra some na impressão/PDF (@media print).

export const BARRA_IMPRIMIR = `
  <style>
    .barra-imprimir { max-width: 960px; margin: 28px auto 8px; padding: 16px 20px;
      display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
      background: #fff; border: 1px solid #E2EBE7; border-radius: 12px;
      font-family: -apple-system, Segoe UI, Roboto, Arial, Helvetica, sans-serif; }
    .barra-imprimir p { margin: 0; font-size: 14px; color: #1A2E25; }
    .barra-imprimir p span { display: block; font-size: 12px; color: #557063; margin-top: 2px; }
    .barra-imprimir .acoes { display: flex; gap: 10px; }
    .barra-imprimir button { font: inherit; font-size: 14px; font-weight: 600; padding: 10px 20px;
      border-radius: 8px; cursor: pointer; }
    .barra-imprimir .fechar { background: #fff; color: #557063; border: 1px solid #E2EBE7; }
    .barra-imprimir .fechar:hover { background: #F1F5F3; }
    .barra-imprimir .imprimir { background: #004147; color: #fff; border: 1px solid #004147; }
    .barra-imprimir .imprimir:hover { background: #1E4A38; }
    @media print { .barra-imprimir { display: none !important; } }
  </style>
  <div class="barra-imprimir">
    <p>Confira os dados acima antes de imprimir.
      <span>Para salvar em PDF, escolha "Salvar como PDF" no destino da impressão.</span></p>
    <div class="acoes">
      <button type="button" class="fechar" onclick="window.close()">Fechar</button>
      <button type="button" class="imprimir" onclick="window.print()">Imprimir</button>
    </div>
  </div>
  <script>window.onload = function () { window.focus(); }</script>`

// ── "Gerado por" ────────────────────────────────────────────────────────────
// Quem está gerando o relatório, para aparecer no cabeçalho:
//  - login de empresa → nome fantasia (ou razão social) da empresa
//  - administrador    → "Administrador (e-mail)", pois o admin não tem nome

const escHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function nomeDoUsuario(): string | null {
  const { role, empresa, admin } = authStore.getState()
  if (role === 'EMPRESA' && empresa) return empresa.nomeFantasia || empresa.razaoSocial
  if (role === 'ADMIN' && admin) return `Administrador (${admin.email})`
  return null
}

// Trecho pronto para a linha de informações: " · Gerado por <b>Nome</b>".
export function geradoPorHtml(): string {
  const nome = nomeDoUsuario()
  return nome ? ` &nbsp;·&nbsp; Gerado por <b>${escHtml(nome)}</b>` : ''
}
