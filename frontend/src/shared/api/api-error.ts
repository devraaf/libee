import type { AxiosError } from 'axios';

interface ProblemDetail {
  title?: string;
  detail?: string;
  status?: number;
  traceId?: string;
  errors?: Array<{ field: string; message: string }>;
  accessionNumbers?: string[];
  accessionNumber?: string;
  bookId?: number;
}

const fallbackByStatus = (status: number): string => {
  if (status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (status === 403) return 'Você não tem permissão para esta ação.';
  if (status === 404) return 'Recurso não encontrado.';
  if (status >= 500)
    return 'Erro interno do servidor. Tente novamente mais tarde.';
  return 'Não foi possível concluir a operação. Tente novamente.';
};

/** Erro padrão do front: message já vem pronta para exibir ao usuário. */
export class ApiError extends Error {
  readonly status?: number;
  readonly traceId?: string;
  readonly errors: Array<{ field: string; message: string }>;
  readonly accessionNumbers: string[];
  readonly accessionNumber?: string;
  readonly bookId?: number;

  constructor(
    message: string,
    status?: number,
    traceId?: string,
    details: Pick<
      ProblemDetail,
      'errors' | 'accessionNumbers' | 'accessionNumber' | 'bookId'
    > = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.traceId = traceId;
    this.errors = details.errors ?? [];
    this.accessionNumbers = details.accessionNumbers ?? [];
    this.accessionNumber = details.accessionNumber;
    this.bookId = details.bookId;
  }

  static from(error: AxiosError<ProblemDetail>): ApiError {
    if (!error.response) {
      return new ApiError(
        'Não foi possível conectar ao servidor. Verifique sua conexão.',
      );
    }
    const { data } = error.response;
    const status = data?.status ?? error.response.status;
    // 5xx: não expõe detalhe técnico ao usuário; o traceId fica para suporte
    const message =
      status < 500 && data?.detail ? data.detail : fallbackByStatus(status);
    return new ApiError(message, status, data?.traceId, data);
  }
}
