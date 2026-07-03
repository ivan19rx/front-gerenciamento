import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Lancamentos from './pages/Lancamentos'
import Movimentacoes from './pages/Movimentacoes'
import Categorias from './pages/Categorias'
import TipoDeConta from './pages/TipoDeConta'
import ExtratoCliente from './pages/ExtratoCLiente'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import { AdminLayout } from './pages/admin/AdminLayout'
import Empresas from './components/admin/Empresas'
import { RequireEmpresaView, RequireAdmin, RedirectIfAuthed } from './auth/guards'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        {/* Área da empresa (também acessada pelo admin ao "Acessar" uma empresa) */}
        <Route element={<RequireEmpresaView />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes"        element={<Clientes />} />
            <Route path="lancamentos"     element={<Lancamentos />} />
            <Route path="movimentacoes"   element={<Movimentacoes />} />
            <Route path="categorias"      element={<Categorias />} />
            <Route path="tipodeconta"     element={<TipoDeConta />} />
            <Route path="extrato-cliente" element={<ExtratoCliente />} />
          </Route>
        </Route>

        {/* Área do administrador */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Empresas />} />
          </Route>
        </Route>

        <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />

        {/* Qualquer rota não reconhecida */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
