package br.edu.fatec.libee.backend.exception;

public record ValidationError(String field, String message) {}
