package br.edu.fatec.libee.backend.exception;

import java.util.List;

public class DeletionBlockedException extends RuntimeException {
  private final List<String> accessionNumbers;

  private DeletionBlockedException(String message, List<String> accessionNumbers) {
    super(message);
    this.accessionNumbers = accessionNumbers;
  }

  public static DeletionBlockedException forCopy(String accessionNumber) {
    return new DeletionBlockedException(
            "Não é possível excluir o exemplar " + accessionNumber + ": ele está emprestado.",
            List.of(accessionNumber));
  }

  public static DeletionBlockedException forBook(List<String> accessionNumbers) {
    return new DeletionBlockedException(
            "Não é possível excluir o livro: há exemplares emprestados (tombos "
                    + String.join(", ", accessionNumbers) + ").",
            accessionNumbers);
  }

  public List<String> getAccessionNumbers() {
    return accessionNumbers;
  }
}
