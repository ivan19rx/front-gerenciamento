import { useState } from 'react'
import { useFetch } from './useFetch'
import { apiFetch } from '../auth/api'
import { getErrorMessage } from '../utils/format'

type Errors<F> = Partial<Record<keyof F, string>>

interface UseCrudOptions<T, F> {
  // Endpoint REST base (ex: '/categorias'). Listagem usa GET, criação POST,
  // edição PUT/PATCH em `${endpoint}/${id}`, exclusão DELETE em `${endpoint}/${id}`.
  endpoint: string
  // Formulário vazio (estado inicial ao abrir "novo").
  emptyForm: F
  // Converte uma entidade existente no formulário (ao abrir "editar").
  toForm: (item: T) => F
  // Converte o formulário no corpo enviado à API.
  buildBody: (form: F) => unknown
  // Validação client-side; retorna erros por campo (vazio = válido).
  validate?: (form: F) => Errors<F>
  // Método usado na edição (algumas APIs usam PATCH). Padrão: PUT.
  editMethod?: 'PUT' | 'PATCH'
  // Chamado após qualquer mutação bem-sucedida (criar/editar/excluir). Útil
  // para revalidar dados derivados que vivem fora da listagem (ex: um resumo
  // agregado servido por outro endpoint).
  onMutate?: () => void
}

// Centraliza o CRUD repetido nas páginas de cadastro: estado dos modais,
// formulário, validação, submissão e tratamento de erro. Erros de validação
// vão para `formErrors` (por campo); erros vindos da API vão para `serverError`.
export function useCrud<T extends { id: number }, F>({
  endpoint, emptyForm, toForm, buildBody, validate, editMethod = 'PUT', onMutate,
}: UseCrudOptions<T, F>) {
  const { data, loading, error, refetch } = useFetch<T[]>(endpoint)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<T | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)

  const [form, setForm] = useState<F>(emptyForm)
  const [formErrors, setFormErrors] = useState<Errors<F>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setForm(emptyForm); setFormErrors({}); setServerError(null); setCreateOpen(true)
  }
  function openEdit(item: T) {
    setForm(toForm(item)); setFormErrors({}); setServerError(null); setEditTarget(item)
  }
  function openDelete(item: T) { setDeleteTarget(item) }

  function closeCreate() { setCreateOpen(false) }
  function closeEdit() { setEditTarget(null) }
  function closeDelete() { setDeleteTarget(null) }

  function isValid(): boolean {
    if (!validate) return true
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return false }
    return true
  }

  // Faz a requisição (com token/empresa anexados) e lança Error com mensagem
  // amigável em caso de falha. `path` começa com '/', ex: '/categorias'.
  async function request(path: string, method: string, body?: unknown) {
    const res = await apiFetch(path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      let message = `Erro ${res.status}`
      try { const b = await res.json(); message = b.message ?? message } catch { /* corpo não-JSON */ }
      throw new Error(message)
    }
  }

  async function submitCreate() {
    if (!isValid()) return
    setSubmitting(true); setServerError(null)
    try {
      await request(endpoint, 'POST', buildBody(form))
      setCreateOpen(false); refetch(); onMutate?.()
    } catch (e) {
      setServerError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitEdit() {
    if (!editTarget) return
    if (!isValid()) return
    setSubmitting(true); setServerError(null)
    try {
      await request(`${endpoint}/${editTarget.id}`, editMethod, buildBody(form))
      setEditTarget(null); refetch(); onMutate?.()
    } catch (e) {
      setServerError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await request(`${endpoint}/${deleteTarget.id}`, 'DELETE')
      setDeleteTarget(null); refetch(); onMutate?.()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  return {
    // dados
    data, loading, error, refetch,
    // estado dos modais
    createOpen, editTarget, deleteTarget,
    // formulário
    form, setForm, formErrors, serverError, submitting, deleting,
    // ações
    openCreate, openEdit, openDelete,
    closeCreate, closeEdit, closeDelete,
    submitCreate, submitEdit, confirmDelete,
  }
}
