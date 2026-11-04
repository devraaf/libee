import {
  mockAuthors,
  mockCategories,
  mockCourses,
} from '../../../shared/mocks/data';
import { simulateServiceDelay } from '../../../shared/mocks/service-utils';
import type { Author, Category, Course } from '../../../shared/types/library';

export async function listCategories(): Promise<Category[]> {
  await simulateServiceDelay();
  return mockCategories.map((category) => ({ ...category }));
}

export async function listAuthors(): Promise<Author[]> {
  await simulateServiceDelay();
  return mockAuthors.map((author) => ({ ...author }));
}

export async function listCourses(): Promise<Course[]> {
  await simulateServiceDelay();
  return mockCourses.map((course) => ({ ...course }));
}
