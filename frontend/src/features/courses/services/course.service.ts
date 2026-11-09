import { httpClient } from '@/shared/api/http-client';
import type { Course } from '@/shared/types/library';

export async function listCourses(): Promise<Course[]> {
  const { data } = await httpClient.get<Course[]>('/courses');
  return data;
}

export async function createCourse(name: string): Promise<Course> {
  const { data } = await httpClient.post<Course>('/courses', { name });
  return data;
}
