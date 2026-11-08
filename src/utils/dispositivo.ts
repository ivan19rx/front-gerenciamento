// Dados do aparelho enviados junto com o login, para o histórico de logins do
// administrador. O User-Agent sozinho não diz mais a versão real do sistema
// (Windows 11 aparece como 10) nem o modelo do celular Android; os navegadores
// baseados em Chromium informam isso pelas "client hints" abaixo. Safari e
// Firefox não têm essa API: aí o backend usa só o User-Agent.

interface MarcaUA { brand: string; version: string }
interface UADataValores {
  platform?: string
  platformVersion?: string
  model?: string
  mobile?: boolean
  fullVersionList?: MarcaUA[]
  brands?: MarcaUA[]
}
interface UAData {
  brands?: MarcaUA[]
  mobile?: boolean
  platform?: string
  getHighEntropyValues?: (dicas: string[]) => Promise<UADataValores>
}

export interface DicasDispositivo {
  plataforma?: string
  versaoPlataforma?: string
  modelo?: string
  mobile?: boolean
  toque?: boolean
  marcas?: { marca: string; versao: string }[]
}

// Nunca atrasa o login por mais de ~400 ms nem lança erro.
export async function dicasDoDispositivo(): Promise<DicasDispositivo> {
  const dicas: DicasDispositivo = { toque: navigator.maxTouchPoints > 1 }
  const ua = (navigator as Navigator & { userAgentData?: UAData }).userAgentData
  if (!ua) return dicas

  dicas.plataforma = ua.platform || undefined
  dicas.mobile = ua.mobile
  dicas.marcas = ua.brands?.map(b => ({ marca: b.brand, versao: b.version }))

  try {
    const valores = await Promise.race([
      ua.getHighEntropyValues?.(['platformVersion', 'model', 'fullVersionList']),
      new Promise<undefined>(r => setTimeout(() => r(undefined), 400)),
    ])
    if (valores) {
      dicas.versaoPlataforma = valores.platformVersion || undefined
      dicas.modelo = valores.model || undefined
      if (valores.fullVersionList?.length) {
        dicas.marcas = valores.fullVersionList.map(b => ({ marca: b.brand, versao: b.version }))
      }
    }
  } catch {
    // sem as dicas detalhadas, o backend usa o User-Agent
  }
  return dicas
}
