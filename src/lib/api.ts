import type { DashboardData, JobStatus, NewPrintInput } from '@/types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response
  try { response = await fetch(url, options) }
  catch { throw new Error('Não foi possível conectar ao servidor. Verifique se ele está em execução.') }
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error ?? 'Não foi possível concluir a operação.')
  if (!body) throw new Error('O servidor retornou uma resposta inválida.')
  return body as T
}

export function loadDashboard(signal?: AbortSignal) {
  return request<DashboardData>('/api/dashboard', { signal })
}

export async function addPrint(input: NewPrintInput) {
  const { fileName, printer, hours, minutes } = input
  const result = await request<{ id: string; dashboard: DashboardData }>('/api/jobs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, printer, hours, minutes }),
  })
  return result.dashboard
}

export function removePrint(id: string) {
  return request<DashboardData>('/api/jobs/' + encodeURIComponent(id), { method: 'DELETE' })
}

export function moveJob(id: string, status: JobStatus) {
  return request<DashboardData>('/api/jobs/' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}
