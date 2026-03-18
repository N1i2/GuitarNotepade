namespace Application.DTOs.Users;

public record BlockUserResponseDto(
    Guid UserId,
    bool WasBlocked,
    DateTime? BlockedUntil,
    string? BlockReason,
    string Message);

