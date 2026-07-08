import { api } from './client'

export interface Tag {
  id: number
  name: string
  color: string | null
  createdAt: string
  updatedAt: string
}

export const getTags = () => api.get<Tag[]>('/api/tags')

export const createTag = (data: { name: string; color?: string }) =>
  api.post<Tag>('/api/tags', data)

export const updateTag = (id: number, data: { name?: string; color?: string | null }) =>
  api.put<Tag>(`/api/tags/${id}`, data)

export const deleteTag = (id: number) => api.delete<void>(`/api/tags/${id}`)
