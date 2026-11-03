package br.edu.fatec.libee.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.Clock;
import java.time.LocalDate;

public class AfterTodayValidator implements ConstraintValidator<AfterToday, LocalDate> {
    private final Clock clock;

    public AfterTodayValidator(Clock clock){
        this.clock = clock;
    }

    @Override
    public boolean isValid(LocalDate value, ConstraintValidatorContext context) {
        return value == null || value.isAfter(LocalDate.now(clock));
    }
}
