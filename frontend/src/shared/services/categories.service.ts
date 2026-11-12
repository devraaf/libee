import { httpClient } from '@/shared/api/http-client';
import type { Category } from '@/shared/types/library';

export async function listCategories(): Promise<Category[]> {
  const { data } = await httpClient.get<Category[]>('/categories');
  return data;
}
