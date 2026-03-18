namespace Application.DTOs.Users;

public record LoginUserDto(
    string Email,
    string Password);