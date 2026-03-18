namespace Application.DTOs.Users;

public record AuthResponseDto(
    Guid UserId,
    string Email,
    string NikName,
    string Role,
    bool HasPremium,
    string Token);