namespace Application.DTOs;

public record AuthResponseDto(
    Guid UserId,
    string Email,
    string NikName,
    string Role,
    string Token);