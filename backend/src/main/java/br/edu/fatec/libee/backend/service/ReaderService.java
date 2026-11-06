package br.edu.fatec.libee.backend.service;

import br.edu.fatec.libee.backend.dto.response.PageResponse;
import br.edu.fatec.libee.backend.dto.response.ReaderListItemResponse;
import br.edu.fatec.libee.backend.dto.response.ReaderSummaryResponse;
import br.edu.fatec.libee.backend.entity.User;
import br.edu.fatec.libee.backend.enums.AffiliationType;
import br.edu.fatec.libee.backend.enums.LoanStatus;
import br.edu.fatec.libee.backend.enums.ReaderStatus;
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
    private final Clock clock;
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public ReaderSummaryResponse getSummary() {
        var summary = userRepository.summarizeReaders(LocalDate.now(clock));
        return new ReaderSummaryResponse(
                summary.getTotalReaders(),
                summary.getReadersWithActiveLoans(),
                summary.getReadersWithOverdueLoans());
    }

    @Transactional(readOnly = true)
    public PageResponse<ReaderListItemResponse> list(
            String search, AffiliationType linkType, Integer courseId,
            List<ReaderStatus> statuses, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name", "id"));

        Specification<User> spec = Specification.allOf(
                ReaderSpecification.isReader(),
                ReaderSpecification.matchesSearch(search),
                ReaderSpecification.hasAffiliationType(linkType),
                ReaderSpecification.hasCourse(courseId),
                ReaderSpecification.hasStatus(statuses));

        Page<User> readers = userRepository.findAll(spec, pageable);

        List<Integer> ids = readers.getContent().stream().map(User::getId).toList();
        Map<Integer, String> courses = loadCourseNames(ids);
        Map<Integer, LoanCounts> loans = loadLoanCounts(ids);

        return PageResponse.from(readers.map(user -> {
            LoanCounts counts = loans.getOrDefault(user.getId(), new LoanCounts(0, 0));
            return new ReaderListItemResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getAffiliationType(),
                    courses.get(user.getId()),
                    counts.activeLoans(),
                    counts.overdueLoans() > 0 ? ReaderStatus.PENDING : ReaderStatus.REGULAR);
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

    private Map<Integer, LoanCounts> loadLoanCounts(List<Integer> ids) {
        Map<Integer, LoanCounts> result = new HashMap<>();
        if (ids.isEmpty()) {
            return result;
        }
        List<Object[]> rows = entityManager.createQuery(
                        "select l.readerId, "
                                + "sum(case when l.status <> :returned then 1L else 0L end), "
                                + "sum(case when l.status = :overdue then 1L else 0L end) "
                                + "from LoanStatusView l where l.readerId in :ids group by l.readerId",
                        Object[].class)
                .setParameter("ids", ids)
                .setParameter("returned", LoanStatus.RETURNED)
                .setParameter("overdue", LoanStatus.OVERDUE)
                .getResultList();
        for (Object[] row : rows) {
            result.put((Integer) row[0], new LoanCounts(
                    ((Number) row[1]).longValue(),
                    ((Number) row[2]).longValue()));
        }
        return result;
    }

    private record LoanCounts(long activeLoans, long overdueLoans) {
    }
}
