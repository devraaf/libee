package br.edu.fatec.libee.backend;

import br.edu.fatec.libee.backend.entity.*;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.CopyStatus;
import br.edu.fatec.libee.backend.enums.UserProfile;
import br.edu.fatec.libee.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@TestComponent
@RequiredArgsConstructor
public class TestData {

    public static final String PASSWORD = "Senha@123";

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;
    private final CopyRepository copyRepository;
    private final LoanRepository loanRepository;
    private final StudentRepository studentRepository;
    private final AtomicInteger sequence = new AtomicInteger();

    public User saveUser(String name, String email, String phone,
                         AffiliationType affiliationType, UserProfile profile) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        user.setAffiliationType(affiliationType);
        user.setProfile(profile);
        return userRepository.save(user);
    }

    public User saveUser(String email, UserProfile profile) {
        return saveUser("Usuário de Teste", email, null, AffiliationType.EMPLOYEE, profile);
    }

    public Course saveCourse(String name) {
        Course course = new Course();
        course.setName(name);
        return courseRepository.save(course);
    }

    public Category saveCategory(String name) {
        Category category = new Category();
        category.setName(name);
        return categoryRepository.save(category);
    }

    public Author saveAuthor(String name) {
        Author a = new Author();
        a.setName(name);
        return authorRepository.save(a);
    }

    public Book saveBook(String isbn, String title, Category category, Author... authors) {
        Book b = new Book();
        b.setIsbn(isbn);
        b.setTitle(title);
        b.setCategory(category);
        b.getAuthors().addAll(List.of(authors));
        return bookRepository.save(b);
    }

    public Copy saveCopy(Book book, String accession, CopyStatus status) {
        Copy c = new Copy();
        c.setBook(book);
        c.setAccessionNumber(accession);
        c.setPhysicalLocation("A-01");
        c.setStatus(status);
        return copyRepository.save(c);
    }

    public Loan saveLoan(User reader, User librarian, LocalDate dueDate, LocalDate returnDate) {
        int n = sequence.incrementAndGet();

        Category category = categoryRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> saveCategory("Geral"));

        Book book = saveBook(String.format("979000000%04d", n), "Livro de Teste " + n, category);
        Copy copy = saveCopy(book, "TD-" + n,
                returnDate == null ? CopyStatus.ON_LOAN : CopyStatus.AVAILABLE);

        Loan loan = new Loan();
        loan.setCopy(copy);
        loan.setReader(reader);
        loan.setLibrarian(librarian);
        loan.setLoanDate(dueDate.minusDays(10)); // respeita due_date >= loan_date do banco
        loan.setDueDate(dueDate);
        loan.setReturnDate(returnDate);
        return loanRepository.saveAndFlush(loan);
    }

    public Student saveStudent(User user, Course course) {
        Student student = new Student();
        student.setUser(user);
        student.setCourse(course);
        return studentRepository.saveAndFlush(student);
    }
}