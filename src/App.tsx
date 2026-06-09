import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Lancamentos from './pages/Lancamentos'
import Categorias from './pages/Categorias'
import TipoDeConta from './pages/TipoDeConta'
import ExtratoCliente from './pages/ExtratoCLiente'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes"       element={<Clientes />} />
          <Route path="lancamentos"    element={<Lancamentos />} />
          <Route path="categorias"     element={<Categorias />} />
          <Route path="tipodeconta"    element={<TipoDeConta />} />
          <Route path="extrato-cliente" element={<ExtratoCliente />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
