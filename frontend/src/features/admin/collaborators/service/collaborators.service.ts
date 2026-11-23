import type { UserProfile } from '@/shared/schemas/enums.schema';
import { httpClient } from '@/shared/api/http-client';

export type AffiliationType = 'STUDENT' | 'PROFESSOR' | 'EMPLOYEE';

export interface CreateCollaboratorPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  affiliationType: AffiliationType;
}

export interface UpdateCollaboratorPayload {
  name: string;
  email: string;
  phone?: string;
  profile: UserProfile;
  affiliationType: AffiliationType;
}

export interface CollaboratorResponse {
  id: number;
  name: string;
  email: string;
  profile: UserProfile;
  phone?: string;
  affiliationType?: AffiliationType;
}

export async function listCollaborators(): Promise<CollaboratorResponse[]> {
  const { data } = await httpClient.get<CollaboratorResponse[]>(
    '/users/collaborators',
  );
  return data;
}

export async function createCollaborator(
  payload: CreateCollaboratorPayload,
): Promise<CollaboratorResponse> {
  const normalizedPhone = payload.phone?.replace(/\D/g, '') || undefined;

  const { data } = await httpClient.post<CollaboratorResponse>(
    '/users/librarians',
    {
      name: payload.name.trim(),
      email: payload.email.trim(),
      password: payload.password,
      phone: normalizedPhone,
      affiliationType: payload.affiliationType,
    },
  );

  return {
    ...data,
    phone: normalizedPhone,
    affiliationType: payload.affiliationType,
  };
}

export async function updateCollaborator(
  id: string | number,
  payload: UpdateCollaboratorPayload,
): Promise<CollaboratorResponse> {
  const normalizedPhone = payload.phone?.replace(/\D/g, '') || undefined;

  const { data } = await httpClient.put<CollaboratorResponse>(
    `/users/collaborators/${id}`,
    {
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: normalizedPhone,
      profile: payload.profile,
      affiliationType: payload.affiliationType,
    },
  );

  return {
    ...data,
    phone: normalizedPhone,
    affiliationType: payload.affiliationType,
  };
}

export async function deleteCollaborator(id: string | number): Promise<void> {
  await httpClient.delete(`/users/collaborators/${id}`);
}