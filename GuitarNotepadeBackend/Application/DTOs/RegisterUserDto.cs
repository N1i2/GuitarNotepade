﻿namespace Application.DTOs;

public record RegisterUserDto(
    string Email,
    string NikName,
    string Password,
    string ConfirmPassword);