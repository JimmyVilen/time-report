import { api } from './client'

export interface PlannerBlock {
  id: number
  title: string
  date: string
  startTime: string | null
  endTime: string | null
  color: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type BlockColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange'

export const BLOCK_COLORS: Record<BlockColor, { bg: string; border: string }> = {
  blue:   { bg: 'rgba(55,105,120,0.13)', border: '#376978' },
  green:  { bg: 'rgba(13,81,71,0.13)',   border: '#0d5147' },
  red:    { bg: 'rgba(166,70,56,0.12)',  border: '#a64638' },
  yellow: { bg: 'rgba(174,138,82,0.16)', border: '#9a743c' },
  purple: { bg: 'rgba(105,85,118,0.13)', border: '#695576' },
  orange: { bg: 'rgba(174,105,64,0.13)', border: '#ae6940' },
}

export const DEFAULT_COLOR: BlockColor = 'blue'

export const getPlannerBlocks = (weekStart: string) =>
  api.get<PlannerBlock[]>(`/api/planner-blocks?weekStart=${weekStart}`)

export const createPlannerBlock = (data: {
  title: string
  date: string
  startTime?: string | null
  endTime?: string | null
  color?: string | null
  notes?: string | null
}) => api.post<PlannerBlock>('/api/planner-blocks', data)

export const updatePlannerBlock = (id: number, data: {
  title: string
  date: string
  startTime?: string | null
  endTime?: string | null
  color?: string | null
  notes?: string | null
}) => api.put<PlannerBlock>(`/api/planner-blocks/${id}`, data)

export const deletePlannerBlock = (id: number) =>
  api.delete<void>(`/api/planner-blocks/${id}`)
