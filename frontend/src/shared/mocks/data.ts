import type {
  Author,
  Book,
  Category,
  Copy,
  Course,
  Loan,
  Reader,
  User,
} from '../types/library';
import { dateFromToday } from './dates';

export const mockCategories: Category[] = [
  { id: 1, name: 'Tecnologia' },
  { id: 2, name: 'Ciências' },
  { id: 3, name: 'Literatura' },
  { id: 4, name: 'História' },
  { id: 5, name: 'Administração' },
  { id: 6, name: 'Matemática' },
];

export const mockCourses: Course[] = [
  { id: 1, name: 'Análise e Desenvolvimento de Sistemas' },
  { id: 2, name: 'Gestão Empresarial' },
  { id: 3, name: 'Logística' },
];

export const mockAuthors: Author[] = [
  { id: 1, name: 'Helena Duarte' },
  { id: 2, name: 'Rafael Monteiro' },
  { id: 3, name: 'Clara Nogueira' },
  { id: 4, name: 'Otávio Brandão' },
  { id: 5, name: 'Marina Falcão' },
  { id: 6, name: 'Gustavo Leitão' },
  { id: 7, name: 'Lívia Campos' },
  { id: 8, name: 'André Vasconcelos' },
  { id: 9, name: 'Joana Ribeiro' },
  { id: 10, name: 'Paulo Siqueira' },
];

export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Beatriz Carvalho',
    email: 'beatriz.carvalho@example.com',
    password: 'Libee@2026',
    phone: '11912340001',
    affiliationType: 'EMPLOYEE',
    profile: 'ADMINISTRATOR',
  },
  {
    id: 2,
    name: 'Carlos Mendes',
    email: 'carlos.mendes@example.com',
    password: 'Libee@2026',
    phone: '11912340002',
    affiliationType: 'EMPLOYEE',
    profile: 'LIBRARIAN',
  },
  {
    id: 3,
    name: 'Daniela Prado',
    email: 'daniela.prado@example.com',
    password: 'Libee@2026',
    phone: '1133340003',
    affiliationType: 'EMPLOYEE',
    profile: 'LIBRARIAN',
  },
  {
    id: 4,
    name: 'Eduardo Lima',
    email: 'eduardo.lima@example.com',
    password: 'Libee@2026',
    phone: '11912340004',
    affiliationType: 'STUDENT',
    profile: 'READER',
  },
  {
    id: 5,
    name: 'Fernanda Rocha',
    email: 'fernanda.rocha@example.com',
    password: 'Libee@2026',
    phone: null,
    affiliationType: 'STUDENT',
    profile: 'READER',
  },
  {
    id: 6,
    name: 'Gabriel Teixeira',
    email: 'gabriel.teixeira@example.com',
    password: 'Libee@2026',
    phone: '11912340006',
    affiliationType: 'STUDENT',
    profile: 'READER',
  },
  {
    id: 7,
    name: 'Henrique Azevedo',
    email: 'henrique.azevedo@example.com',
    password: 'Libee@2026',
    phone: '1133340007',
    affiliationType: 'PROFESSOR',
    profile: 'READER',
  },
  {
    id: 8,
    name: 'Isabela Freitas',
    email: 'isabela.freitas@example.com',
    password: 'Libee@2026',
    phone: '11912340008',
    affiliationType: 'EMPLOYEE',
    profile: 'READER',
  },
  ...(
    [
      ['Lucas Martins', 'STUDENT', 'lucas.martins@example.com'],
      ['Mariana Alves', 'STUDENT', 'mariana.alves@example.com'],
      ['Nicolas Costa', 'STUDENT', 'nicolas.costa@example.com'],
    ] as const
  ).map(([name, affiliationType, email], index) => ({
    id: index + 9,
    name: String(name),
    email: String(email),
    password: 'Libee@2026',
    phone: null,
    affiliationType,
    profile: 'READER' as const,
  })),
];

export const mockReaders: Reader[] = mockUsers
  .filter((user): user is Reader => user.profile === 'READER')
  .map((reader) => ({
    ...reader,
    ...(reader.id === 4 || reader.id === 5
      ? { courseId: 1 }
      : reader.id === 6 || reader.id === 10
        ? { courseId: 2 }
        : reader.id === 9 || reader.id === 11
          ? { courseId: 3 }
          : {}),
  }));

const bookRows = [
  ['Introdução à Engenharia de Software', 'Tecnologia', '2021-03-15', 412, [1]],
  ['Banco de Dados na Prática', 'Tecnologia', '2019-08-01', 358, [2, 3]],
  ['Fundamentos de Física', 'Ciências', '2003-05-20', 520, [4]],
  ['Química do Cotidiano', 'Ciências', '2018-11-10', 290, [5]],
  ['Contos de uma Cidade Imaginária', 'Literatura', '2020-02-14', 184, [3]],
  ['O Farol e a Névoa', 'Literatura', '2015-09-30', 246, [6]],
  ['História da Biblioteca Imaginária', 'História', '2017-06-05', 332, [1]],
  ['Linha do Tempo de um Século', 'História', '2022-10-22', 400, [2]],
  ['Algoritmos para Todos', 'Tecnologia', '2022-04-12', 384, [7, 8]],
  ['Redes e Sistemas Distribuídos', 'Tecnologia', '2020-07-18', 460, [8]],
  ['Inteligência Artificial Aplicada', 'Tecnologia', '2023-01-09', 318, [7, 9]],
  ['Ecologia Urbana', 'Ciências', '2016-05-27', 276, [5, 10]],
  ['Astronomia para Curiosos', 'Ciências', '2021-08-03', 302, [4]],
  ['A Casa das Janelas Azuis', 'Literatura', '2019-03-11', 220, [9]],
  ['Cartas do Amanhã', 'Literatura', '2024-02-08', 198, [3, 6]],
  ['Memórias de uma Cidade', 'História', '2014-12-01', 368, [10]],
  ['Brasil: Caminhos e Encontros', 'História', '2020-06-20', 440, [1, 5]],
  ['Gestão de Projetos Essencial', 'Administração', '2022-09-15', 344, [2, 8]],
  ['Empreendedorismo em Prática', 'Administração', '2023-05-05', 286, [7]],
  [
    'Logística e Cadeia de Suprimentos',
    'Administração',
    '2018-10-17',
    390,
    [10, 2],
  ],
  ['Matemática Aplicada', 'Matemática', '2017-04-23', 410, [4, 9]],
  ['Estatística sem Mistério', 'Matemática', '2021-11-02', 268, [5]],
  ['Geometria no Cotidiano', 'Matemática', '2016-01-30', 234, [6, 4]],
  ['Código Limpo para Iniciantes', 'Tecnologia', '2024-07-19', 328, [8, 7]],
  ['Crônicas do Jardim Secreto', 'Literatura', '2013-04-06', 212, [3]],
] as const;

export const mockBooks: Book[] = bookRows.map(
  ([title, categoryName, publicationDate, pageCount, authorIds], index) => {
    const id = index + 1;
    const category = mockCategories.find(({ name }) => name === categoryName);
    if (!category) throw new Error(`Categoria inexistente: ${categoryName}`);

    return {
      id,
      isbn:
        [
          '9780000000019',
          '9780000000026',
          '0123456789',
          '9780000000040',
          '9780000000057',
          '9780000000064',
          '9780000000071',
          '9780000000088',
        ][id - 1] ?? `9786500000${String(id).padStart(3, '0')}`,
      title,
      publisher: id % 2 === 0 ? 'Editora Modelo' : 'Editora Exemplo',
      publicationPlace: ['São Paulo', 'Campinas', 'Curitiba'][index % 3],
      edition: `${(index % 3) + 1}ª edição`,
      coverImageUrl: id === 14 ? null : '/images/book-cover-placeholder.svg',
      publicationDate,
      pageCount,
      summary: `Obra fictícia de ${categoryName.toLowerCase()} para os dados de demonstração da biblioteca.`,
      category,
      authors: authorIds.map((authorId) => {
        const author = mockAuthors.find(
          ({ id: currentId }) => currentId === authorId,
        );
        if (!author) throw new Error(`Autor inexistente: ${authorId}`);
        return author;
      }),
    };
  },
);

export const mockCopies: Copy[] = mockBooks.flatMap((book) =>
  [0, 1]
    .filter(
      (copyIndex) => !([4, 5, 6, 10, 15].includes(book.id) && copyIndex === 1),
    )
    .map((copyIndex) => {
      const id = (book.id - 1) * 2 + copyIndex + 1;
      const isOnLoan = [2, 7, 9, 11, 19, 29].includes(id);

      return {
        id,
        bookId: book.id,
        accessionNumber: String(id).padStart(4, '0'),
        physicalLocation: `Estante ${String.fromCharCode(65 + ((book.id - 1) % 8))}-${String(copyIndex + 1).padStart(2, '0')}`,
        status: isOnLoan ? ('ON_LOAN' as const) : ('AVAILABLE' as const),
      };
    }),
);

export const mockLoans: Omit<Loan, 'status'>[] = [
  {
    id: 1,
    copyId: 1,
    readerId: 4,
    librarianId: 2,
    loanDate: dateFromToday(-32),
    dueDate: dateFromToday(-18),
    returnDate: dateFromToday(-20),
    renewalCount: 0,
  },
  {
    id: 2,
    copyId: 3,
    readerId: 5,
    librarianId: 3,
    loanDate: dateFromToday(-30),
    dueDate: dateFromToday(-16),
    returnDate: dateFromToday(-10),
    renewalCount: 1,
  },
  {
    id: 3,
    copyId: 5,
    readerId: 7,
    librarianId: 2,
    loanDate: dateFromToday(-25),
    dueDate: dateFromToday(-11),
    returnDate: dateFromToday(-13),
    renewalCount: 2,
  },
  {
    id: 4,
    copyId: 2,
    readerId: 6,
    librarianId: 2,
    loanDate: dateFromToday(-4),
    dueDate: dateFromToday(10),
    returnDate: null,
    renewalCount: 0,
  },
  {
    id: 5,
    copyId: 7,
    readerId: 8,
    librarianId: 3,
    loanDate: dateFromToday(-3),
    dueDate: dateFromToday(20),
    returnDate: null,
    renewalCount: 1,
  },
  {
    id: 6,
    copyId: 9,
    readerId: 4,
    librarianId: 3,
    loanDate: dateFromToday(-30),
    dueDate: dateFromToday(-16),
    returnDate: null,
    renewalCount: 0,
  },
  {
    id: 7,
    copyId: 11,
    readerId: 5,
    librarianId: 2,
    loanDate: dateFromToday(-25),
    dueDate: dateFromToday(-8),
    returnDate: null,
    renewalCount: 2,
  },
  {
    id: 8,
    copyId: 2,
    readerId: 7,
    librarianId: 3,
    loanDate: dateFromToday(-80),
    dueDate: dateFromToday(-66),
    returnDate: dateFromToday(-67),
    renewalCount: 0,
  },
  {
    id: 9,
    copyId: 19,
    readerId: 9,
    librarianId: 2,
    loanDate: dateFromToday(-1),
    dueDate: dateFromToday(13),
    returnDate: null,
    renewalCount: 0,
  },
  {
    id: 10,
    copyId: 29,
    readerId: 10,
    librarianId: 3,
    loanDate: dateFromToday(-18),
    dueDate: dateFromToday(-4),
    returnDate: null,
    renewalCount: 0,
  },
];
