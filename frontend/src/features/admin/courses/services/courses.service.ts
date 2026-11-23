import { httpClient } from '@/shared/api/http-client';

export interface CourseResponse {
  id: number;
  name: string;
}

export interface CreateCoursePayload {
  name: string;
}

export async function listCourses(): Promise<CourseResponse[]> {
  const { data } = await httpClient.get<CourseResponse[]>('/courses');
  return data;
}

export async function createCourse(
  payload: CreateCoursePayload,
): Promise<CourseResponse> {
  const { data } = await httpClient.post<CourseResponse>('/courses', payload);
  return data;
}

export async function deleteCourse(id: string | number): Promise<void> {
  await httpClient.delete(`/courses/${id}`);
}