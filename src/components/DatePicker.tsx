import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { C } from '../theme'

// Campo de data com calendário próprio, no visual do site (o calendário nativo
// do navegador não aceita estilo). Trabalha com datas ISO "aaaa-mm-dd" — o
// mesmo formato do <input type="date"> — então é só trocar um pelo outro.
//
// Dá para digitar (dd/mm/aaaa) ou escolher no calendário. O calendário é
// renderizado em portal para não ser cortado por modais com overflow oculto.

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const DIAS_SEMANA_LONGOS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

const COR = {
  borda: '#E2EBE7',
  texto: '#1A2E25',
  textoSuave: '#557063',
  foraDoMes: '#A7BDB3',
  hover: '#EEF3F1',
  intervalo: '#E3F1EA',
  selecionado: C.sidebarBg,
  hoje: C.activeIcon,
  erro: '#DC2626',
}

// ── Datas sem fuso horário ──────────────────────────────────────────────────
type Dia = { a: number; m: number; d: number } // m: 0–11

const pad = (n: number) => String(n).padStart(2, '0')
const paraIso = ({ a, m, d }: Dia) => `${a}-${pad(m + 1)}-${pad(d)}`
const diasNoMes = (a: number, m: number) => new Date(a, m + 1, 0).getDate()

function deIso(iso: string | undefined): Dia | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  if (!r) return null
  const a = Number(r[1]), m = Number(r[2]) - 1, d = Number(r[3])
  if (m < 0 || m > 11 || d < 1 || d > diasNoMes(a, m)) return null
  return { a, m, d }
}

function hoje(): Dia {
  const h = new Date()
  return { a: h.getFullYear(), m: h.getMonth(), d: h.getDate() }
}

function somarDias(dia: Dia, n: number): Dia {
  const x = new Date(dia.a, dia.m, dia.d + n)
  return { a: x.getFullYear(), m: x.getMonth(), d: x.getDate() }
}

function somarMeses(dia: Dia, n: number): Dia {
  const x = new Date(dia.a, dia.m + n, 1)
  const a = x.getFullYear(), m = x.getMonth()
  return { a, m, d: Math.min(dia.d, diasNoMes(a, m)) }
}

const isoParaTexto = (iso: string) => {
  const dia = deIso(iso)
  return dia ? `${pad(dia.d)}/${pad(dia.m + 1)}/${dia.a}` : ''
}

// "07112026" → "07/11/2026" (máscara enquanto digita)
function mascarar(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 8)
  if (n.length <= 2) return n
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`
}

function textoParaIso(texto: string): string | null {
  const r = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto)
  if (!r) return null
  const iso = `${r[3]}-${r[2]}-${r[1]}`
  return deIso(iso) ? iso : null
}

// ── Estilos de hover/foco ──────────────────────────────────────────────────
// Ficam em CSS (e não inline) porque :hover não existe em style={{}}. Os
// !important vencem os estilos inline de base de cada botão.
const HOVER_DIA = '#D3EBDF'
const ESTILO = `
  @keyframes dpEntrar { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }

  .dp-campo { transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
  .dp-campo:not([data-estado]):hover { border-color: ${C.navIcon} !important; background: #FFFFFF !important; }
  .dp-campo[data-estado="ativo"] { box-shadow: 0 0 0 3px rgba(126, 200, 164, 0.18); }
  .dp-icone { transition: background 0.15s, color 0.15s; }
  .dp-wrap:hover .dp-icone { color: ${C.sidebarBg} !important; }
  .dp-icone:hover { background: ${COR.hover} !important; }

  .dp-nav { transition: background 0.15s, transform 0.1s; }
  .dp-nav:hover { background: rgba(255,255,255,0.14) !important; }
  .dp-nav:active { transform: scale(0.94); }

  .dp-dia { transition: background 0.12s, color 0.12s, box-shadow 0.12s, transform 0.12s; }
  .dp-dia:not(:disabled):not([data-sel]):hover {
    background: ${HOVER_DIA} !important; color: ${C.sidebarBg} !important;
    box-shadow: inset 0 0 0 1px ${C.activeIcon}; transform: translateY(-1px);
  }
  .dp-dia[data-sel]:hover { background: ${C.activeItem} !important; box-shadow: 0 2px 6px rgba(0, 65, 71, 0.3); transform: translateY(-1px); }
  .dp-dia:not(:disabled):active { transform: translateY(0) scale(0.95); }

  .dp-mes { transition: background 0.12s, border-color 0.12s, color 0.12s, transform 0.12s; }
  .dp-mes:not(:disabled):not([data-sel]):hover {
    background: ${HOVER_DIA} !important; border-color: ${C.activeIcon} !important;
    color: ${C.sidebarBg} !important; transform: translateY(-1px);
  }
  .dp-mes[data-sel]:hover { background: ${C.activeItem} !important; }

  .dp-rodape { transition: background 0.12s; }
  .dp-rodape:not(:disabled):hover { background: ${COR.hover} !important; }

  .dp-dia:focus-visible, .dp-mes:focus-visible, .dp-rodape:focus-visible, .dp-nav:focus-visible {
    outline: 2px solid ${C.activeIcon}; outline-offset: 1px;
  }
`

// ── Componente ──────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: string
  onChange: (iso: string) => void
  min?: string
  max?: string
  // Destaca um período no calendário (ex: filtro "de"/"até").
  intervalo?: [string, string]
  error?: boolean
  id?: string
  'aria-label'?: string
  // Variação visual: 'filtro' (barra de filtros) ou 'form' (modais).
  variante?: 'filtro' | 'form'
  placeholder?: string
}

export function DatePicker({
  value, onChange, min, max, intervalo, error, id, variante = 'form',
  placeholder = 'dd/mm/aaaa', ...rest
}: DatePickerProps) {
  const [texto, setTexto] = useState(() => isoParaTexto(value))
  const [aberto, setAberto] = useState(false)
  // true quando o calendário foi aberto pelo teclado: aí o foco vai para os dias.
  // Aberto com clique, o foco fica no campo para a pessoa poder digitar.
  const [focarDias, setFocarDias] = useState(false)
  const [focado, setFocado] = useState(false)
  const [invalido, setInvalido] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const autoId = useId()
  const popId = `${autoId}-cal`

  // valor alterado por fora (ex: botão "limpar filtros")
  // (ajuste durante o render, padrão recomendado pelo React em vez de efeito)
  const [valorAnterior, setValorAnterior] = useState(value)
  if (value !== valorAnterior) {
    setValorAnterior(value)
    setTexto(isoParaTexto(value))
    setInvalido(false)
  }

  const foraDoLimite = (iso: string) => (!!min && iso < min) || (!!max && iso > max)

  function digitar(t: string) {
    const m = mascarar(t)
    setTexto(m)
    if (m === '') { setInvalido(false); if (value) onChange(''); return }
    if (m.length < 10) { setInvalido(false); return }
    const iso = textoParaIso(m)
    if (!iso || foraDoLimite(iso)) { setInvalido(true); return }
    setInvalido(false)
    if (iso !== value) onChange(iso)
  }

  // ao sair do campo, texto incompleto/inválido volta para o valor atual
  function sair() {
    setFocado(false)
    if (texto !== isoParaTexto(value)) { setTexto(isoParaTexto(value)); setInvalido(false) }
  }

  function escolher(iso: string) {
    onChange(iso)
    setTexto(isoParaTexto(iso))
    setInvalido(false)
    setAberto(false)
    inputRef.current?.focus()
  }

  // fecha ao clicar fora (campo + calendário)
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node
      if (wrapRef.current?.contains(alvo) || popRef.current?.contains(alvo)) return
      setAberto(false)
    }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  const filtro = variante === 'filtro'
  const corBorda = error || invalido ? COR.erro : focado || aberto ? C.activeIcon : COR.borda

  return (
    <div ref={wrapRef} className="dp-wrap" style={{ position: 'relative', width: '100%' }}>
      <style>{ESTILO}</style>
      <input
        className="dp-campo"
        data-estado={error || invalido ? 'erro' : focado || aberto ? 'ativo' : undefined}
        ref={inputRef}
        id={id}
        aria-label={rest['aria-label']}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={texto}
        aria-invalid={error || invalido || undefined}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-controls={aberto ? popId : undefined}
        onChange={e => digitar(e.target.value)}
        onFocus={() => setFocado(true)}
        onBlur={sair}
        onClick={() => { if (!aberto) { setFocarDias(false); setAberto(true) } }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' || (e.key === 'Enter' && !aberto)) {
            e.preventDefault()
            setFocarDias(true)
            if (aberto) popRef.current?.querySelector<HTMLButtonElement>('.dp-dia[tabindex="0"]')?.focus()
            else setAberto(true)
          }
          else if (e.key === 'Escape' && aberto) { e.preventDefault(); e.stopPropagation(); setAberto(false) }
        }}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: filtro ? '8px 38px 8px 12px' : '9px 38px 9px 12px',
          borderRadius: 8, border: `1px solid ${corBorda}`,
          fontSize: 14, color: COR.texto, background: '#F9FAFB',
          outline: 'none',
          fontVariantNumeric: 'tabular-nums',
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        className="dp-icone"
        aria-label={aberto ? 'Fechar calendário' : 'Abrir calendário'}
        onMouseDown={e => e.preventDefault()}
        onClick={() => { setFocarDias(false); setAberto(a => !a); inputRef.current?.focus() }}
        style={{
          position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', borderRadius: 6, cursor: 'pointer',
          background: aberto ? COR.hover : 'transparent',
          color: aberto ? C.sidebarBg : COR.textoSuave,
        }}
      >
        <IconeCalendario />
      </button>

      {aberto && (
        <Calendario
          id={popId}
          ancora={wrapRef}
          popRef={popRef}
          value={value}
          min={min}
          max={max}
          intervalo={intervalo}
          focarAoAbrir={focarDias}
          onEscolher={escolher}
          onLimpar={() => { onChange(''); setTexto(''); setInvalido(false); setAberto(false); inputRef.current?.focus() }}
          onFechar={() => { setAberto(false); inputRef.current?.focus() }}
        />
      )}
    </div>
  )
}

// ── Calendário (popover) ────────────────────────────────────────────────────

interface CalendarioProps {
  id: string
  ancora: React.RefObject<HTMLDivElement | null>
  popRef: React.RefObject<HTMLDivElement | null>
  value: string
  min?: string
  max?: string
  intervalo?: [string, string]
  focarAoAbrir: boolean
  onEscolher: (iso: string) => void
  onLimpar: () => void
  onFechar: () => void
}

const LARGURA = 288

function Calendario({ id, ancora, popRef, value, min, max, intervalo, focarAoAbrir, onEscolher, onLimpar, onFechar }: CalendarioProps) {
  const selecionado = deIso(value)
  const hj = hoje()
  const [foco, setFoco] = useState<Dia>(() => selecionado ?? deIso(min && paraIso(hj) < min ? min : max && paraIso(hj) > max ? max : '') ?? hj)
  const [visao, setVisao] = useState<'dias' | 'meses'>('dias')
  const [anoMeses, setAnoMeses] = useState(foco.a)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const gradeRef = useRef<HTMLDivElement>(null)
  const navegando = useRef(focarAoAbrir)

  // Posiciona abaixo do campo (ou acima, se não couber). Recalcula a cada
  // quadro enquanto aberto: acompanha rolagem, redimensionamento e também a
  // animação de entrada dos modais (transform não dispara evento nenhum).
  useLayoutEffect(() => {
    let quadro = 0
    let ultimo = ''
    const calcular = () => {
      const r = ancora.current?.getBoundingClientRect()
      if (r) {
        const alturaPop = popRef.current?.offsetHeight ?? 360
        const abaixo = r.bottom + 6
        const top = abaixo + alturaPop > window.innerHeight - 8 && r.top - alturaPop - 6 > 8
          ? r.top - alturaPop - 6
          : abaixo
        const left = Math.max(8, Math.min(r.left, window.innerWidth - LARGURA - 8))
        const chave = `${top}|${left}`
        if (chave !== ultimo) { ultimo = chave; setPos({ top, left }) }
      }
      quadro = requestAnimationFrame(calcular)
    }
    calcular()
    return () => cancelAnimationFrame(quadro)
  }, [ancora, popRef])

  // mantém o foco do teclado no dia ativo
  useEffect(() => {
    if (visao !== 'dias' || !navegando.current) return
    gradeRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${paraIso(foco)}"]`)?.focus({ preventScroll: true })
  }, [foco, visao])

  const desabilitado = (iso: string) => (!!min && iso < min) || (!!max && iso > max)
  const [iniIntervalo, fimIntervalo] = intervalo && intervalo[0] && intervalo[1] ? intervalo : ['', '']

  // 6 semanas, começando no domingo
  const semanas = useMemo(() => {
    const primeiro = new Date(foco.a, foco.m, 1).getDay()
    const inicio = somarDias({ a: foco.a, m: foco.m, d: 1 }, -primeiro)
    return Array.from({ length: 6 }, (_, s) =>
      Array.from({ length: 7 }, (_, d) => somarDias(inicio, s * 7 + d)))
  }, [foco.a, foco.m])

  function teclado(e: React.KeyboardEvent) {
    const mover: Record<string, () => Dia> = {
      ArrowLeft: () => somarDias(foco, -1),
      ArrowRight: () => somarDias(foco, 1),
      ArrowUp: () => somarDias(foco, -7),
      ArrowDown: () => somarDias(foco, 7),
      PageUp: () => somarMeses(foco, e.shiftKey ? -12 : -1),
      PageDown: () => somarMeses(foco, e.shiftKey ? 12 : 1),
      Home: () => somarDias(foco, -new Date(foco.a, foco.m, foco.d).getDay()),
      End: () => somarDias(foco, 6 - new Date(foco.a, foco.m, foco.d).getDay()),
    }
    if (e.key === 'Tab') { e.preventDefault(); onFechar(); return }
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation()
      if (visao === 'meses') setVisao('dias'); else onFechar()
      return
    }
    if (visao === 'dias' && mover[e.key]) { e.preventDefault(); navegando.current = true; setFoco(mover[e.key]()) }
  }

  const botaoNav: React.CSSProperties = {
    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', borderRadius: 8, background: 'transparent', cursor: 'pointer', color: C.navTextActive,
  }

  const conteudo = (
    <div
      id={id}
      ref={popRef}
      role="dialog"
      aria-label="Escolher data"
      onKeyDown={teclado}
      onMouseDown={e => { if ((e.target as HTMLElement).tagName !== 'BUTTON') e.preventDefault() }}
      style={{
        position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, zIndex: 300,
        width: LARGURA, background: '#fff', borderRadius: 12,
        border: `1px solid ${COR.borda}`, overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(0, 65, 71, 0.18), 0 2px 6px rgba(0,0,0,0.06)',
        animation: 'dpEntrar 0.12s ease',
        visibility: pos ? 'visible' : 'hidden',
      }}
    >

      {/* Cabeçalho no verde do menu lateral */}
      <div style={{ background: C.sidebarBg, padding: '10px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" className="dp-nav" style={botaoNav}
          aria-label={visao === 'dias' ? 'Mês anterior' : 'Ano anterior'}
          onClick={() => visao === 'dias' ? setFoco(somarMeses(foco, -1)) : setAnoMeses(a => a - 1)}>
          <Seta dir="esq" />
        </button>
        <button type="button" className="dp-nav"
          aria-label={visao === 'dias' ? 'Escolher mês e ano' : 'Voltar aos dias'}
          onClick={() => { setAnoMeses(foco.a); setVisao(v => v === 'dias' ? 'meses' : 'dias') }}
          style={{ ...botaoNav, width: 'auto', padding: '0 10px', gap: 6, fontSize: 14, fontWeight: 600, letterSpacing: '0.01em' }}>
          {visao === 'dias'
            ? <><span style={{ textTransform: 'capitalize' }}>{MESES[foco.m]}</span><span style={{ color: C.gold }}>{foco.a}</span></>
            : <span style={{ color: C.gold }}>{anoMeses}</span>}
          <svg width="12" height="12" fill="none" stroke={C.navIcon} strokeWidth="2.5" viewBox="0 0 24 24"
            style={{ transform: visao === 'meses' ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button type="button" className="dp-nav" style={botaoNav}
          aria-label={visao === 'dias' ? 'Próximo mês' : 'Próximo ano'}
          onClick={() => visao === 'dias' ? setFoco(somarMeses(foco, 1)) : setAnoMeses(a => a + 1)}>
          <Seta dir="dir" />
        </button>
      </div>

      {visao === 'dias' ? (
        <div style={{ padding: '10px 10px 6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DIAS_SEMANA.map((d, i) => (
              <abbr key={i} title={DIAS_SEMANA_LONGOS[i]} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 600, textDecoration: 'none',
                color: i === 0 || i === 6 ? COR.foraDoMes : COR.textoSuave, padding: '4px 0',
              }}>{d}</abbr>
            ))}
          </div>
          <div ref={gradeRef} role="grid" aria-label={`${MESES[foco.m]} de ${foco.a}`}>
            {semanas.map((semana, s) => (
              <div key={s} role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {semana.map(dia => {
                  const iso = paraIso(dia)
                  const doMes = dia.m === foco.m
                  const sel = iso === value
                  const ehHoje = iso === paraIso(hj)
                  const off = desabilitado(iso)
                  const noIntervalo = !!iniIntervalo && iso >= iniIntervalo && iso <= fimIntervalo
                  const pontaIni = iso === iniIntervalo, pontaFim = iso === fimIntervalo
                  return (
                    <div key={iso} role="gridcell" aria-selected={sel} style={{
                      padding: '2px 0',
                      background: noIntervalo && iniIntervalo !== fimIntervalo ? COR.intervalo : undefined,
                      borderTopLeftRadius: pontaIni ? 8 : 0, borderBottomLeftRadius: pontaIni ? 8 : 0,
                      borderTopRightRadius: pontaFim ? 8 : 0, borderBottomRightRadius: pontaFim ? 8 : 0,
                    }}>
                      <button
                        type="button"
                        className="dp-dia"
                        data-iso={iso}
                        data-sel={sel ? '1' : undefined}
                        disabled={off}
                        tabIndex={iso === paraIso(foco) ? 0 : -1}
                        aria-label={`${dia.d} de ${MESES[dia.m]} de ${dia.a}${ehHoje ? ' (hoje)' : ''}`}
                        aria-current={ehHoje ? 'date' : undefined}
                        onClick={() => onEscolher(iso)}
                        style={{
                          width: 34, height: 34, margin: '0 auto', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          border: ehHoje && !sel ? `1.5px solid ${COR.hoje}` : '1.5px solid transparent',
                          borderRadius: 8, fontSize: 13,
                          fontWeight: sel || ehHoje ? 700 : doMes ? 500 : 400,
                          fontVariantNumeric: 'tabular-nums',
                          background: sel ? COR.selecionado : (pontaIni || pontaFim) && noIntervalo ? '#C9E5D7' : 'transparent',
                          color: sel ? '#FFFFFF' : doMes ? COR.texto : COR.foraDoMes,
                          cursor: off ? 'not-allowed' : 'pointer',
                          opacity: off ? 0.35 : 1,
                          textDecoration: off ? 'line-through' : undefined,
                        }}
                      >{dia.d}</button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {MESES_CURTOS.map((nome, m) => {
            const fimMes = `${anoMeses}-${pad(m + 1)}-${pad(diasNoMes(anoMeses, m))}`
            const iniMes = `${anoMeses}-${pad(m + 1)}-01`
            const off = (!!min && fimMes < min) || (!!max && iniMes > max)
            const atual = anoMeses === foco.a && m === foco.m
            return (
              <button key={m} type="button" className="dp-mes" disabled={off} data-sel={atual ? '1' : undefined}
                onClick={() => { setFoco({ a: anoMeses, m, d: Math.min(foco.d, diasNoMes(anoMeses, m)) }); setVisao('dias') }}
                style={{
                  padding: '12px 0', borderRadius: 8, fontSize: 13, textTransform: 'capitalize',
                  border: atual ? 'none' : `1px solid ${COR.borda}`,
                  background: atual ? COR.selecionado : '#fff',
                  color: atual ? '#fff' : COR.texto, fontWeight: atual ? 700 : 500,
                  cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.35 : 1,
                }}>{nome}</button>
            )
          })}
        </div>
      )}

      {/* Rodapé */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderTop: `1px solid ${COR.borda}` }}>
        <button type="button" className="dp-rodape" onClick={onLimpar} disabled={!value}
          style={{ ...botaoRodape, color: COR.textoSuave, opacity: value ? 1 : 0.4, cursor: value ? 'pointer' : 'default' }}>
          Limpar
        </button>
        <button type="button" className="dp-rodape" disabled={desabilitado(paraIso(hj))}
          onClick={() => onEscolher(paraIso(hj))}
          style={{ ...botaoRodape, color: C.sidebarBg, fontWeight: 600, opacity: desabilitado(paraIso(hj)) ? 0.4 : 1 }}>
          Hoje
        </button>
      </div>
    </div>
  )

  return createPortal(conteudo, document.body)
}

const botaoRodape: React.CSSProperties = {
  border: 'none', background: 'transparent', borderRadius: 6,
  padding: '6px 10px', fontSize: 13, cursor: 'pointer',
}

function Seta({ dir }: { dir: 'esq' | 'dir' }) {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'esq' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}

function IconeCalendario() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  )
}
