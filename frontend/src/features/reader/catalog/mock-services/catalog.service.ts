import { mockAuthors, mockCourses } from '../../../../shared/mocks/data';
import { simulateServiceDelay } from '../../../../shared/mocks/service-utils';
import type { Author, Course } from '../../../../shared/types/library';

export async function listAuthors(): Promise<Author[]> {
  await simulateServiceDelay();
  return mockAuthors.map((author) => ({ ...author }));
}

export async function listCourses(): Promise<Course[]> {
  await simulateServiceDelay();
  return mockCourses.map((course) => ({ ...course }));
}
