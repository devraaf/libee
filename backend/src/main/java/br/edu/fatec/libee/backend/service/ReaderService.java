package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.response.PageResponse;
import br.edu.fatec.libee.backend.dto.response.ReaderListItemResponse;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.LoanStatus;
import br.edu.fatec.libee.backend.repository.UserRepository;
import br.edu.fatec.libee.backend.specification.ReaderSpecification;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReaderService {
    private final UserRepository userRepository;
    private final EntityManager entityManager;
    private final Clock clock;

    @Transactional(readOnly = true)
    public PageResponse<ReaderListItemResponse> list(
            String search, AffiliationType linkType, Integer courseId,
            List<LoanStatus> loanStatuses, int page, int size) {

        LocalDate today = LocalDate.now(clock);
        Pageable pageable = PageRequest.of(page, size, Sort.by("name", "id"));

        Specification<User> spec = Specification.allOf(
                ReaderSpecification.isReader(),
                ReaderSpecification.matchesSearch(search),
                ReaderSpecification.hasAffiliationType(linkType),
                ReaderSpecification.hasCourse(courseId),
                ReaderSpecification.hasLoanInStatus(loanStatuses, today));

        Page<User> readers = userRepository.findAll(spec, pageable);

        List<Integer> ids = readers.getContent().stream().map(User::getId).toList();
        Map<Integer, String> courses = loadCourseNames(ids);
        Map<Integer, long[]> loans = loadLoanCounts(ids, today);

        return PageResponse.from(readers.map(user -> {
            long[] c = loans.getOrDefault(user.getId(), new long[]{0, 0, 0});
            return new ReaderListItemResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getAffiliationType(),
                    courses.get(user.getId()),
                    c[0], c[1], c[2]);
        }));
    }


    private Map<Integer, String> loadCourseNames(List<Integer> ids) {
        Map<Integer, String> result = new HashMap<>();
        if (ids.isEmpty()) {
            return result;
        }
        List<Object[]> rows = entityManager.createQuery(
                        "select s.id, c.name from Student s join s.course c where s.id in :ids",
                        Object[].class)
                .setParameter("ids", ids)
                .getResultList();
        for (Object[] row : rows) {
            result.put((Integer) row[0], (String) row[1]);
        }
        return result;
    }

    private Map<Integer, long[]> loadLoanCounts(List<Integer> ids, LocalDate today) {
        Map<Integer, long[]> result = new HashMap<>();
        if (ids.isEmpty()) {
            return result;
        }
        List<Object[]> rows = entityManager.createQuery(
                        "select l.reader.id, "
                                + "sum(case when l.returnDate is null then 1L else 0L end), "
                                + "sum(case when l.returnDate is null and l.dueDate < :today then 1L else 0L end), "
                                + "count(l) "
                                + "from Loan l where l.reader.id in :ids group by l.reader.id",
                        Object[].class)
                .setParameter("ids", ids)
                .setParameter("today", today)
                .getResultList();
        for (Object[] row : rows) {
            result.put((Integer) row[0], new long[]{
                    ((Number) row[1]).longValue(),
                    ((Number) row[2]).longValue(),
                    ((Number) row[3]).longValue()});
        }
        return result;
    }
}