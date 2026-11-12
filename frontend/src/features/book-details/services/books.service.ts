import { httpClient } from '@/shared/api/http-client';
import {
  mapBookDetails,
  type BookDetailsDto,
} from '../utils/book-details.mapper';

export async function getBookDetails(
  bookId: number,
): Promise<ReturnType<typeof mapBookDetails>> {
  const { data } = await httpClient.get<BookDetailsDto>(`/books/${bookId}`);
  return mapBookDetails(data);
}
