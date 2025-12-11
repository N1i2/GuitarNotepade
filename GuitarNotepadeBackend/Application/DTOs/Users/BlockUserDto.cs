namespace Application.DTOs.Users;

public record BlockUserDto(
    string Email,
    string Reason,
    DateTime BlockedUntil
);
