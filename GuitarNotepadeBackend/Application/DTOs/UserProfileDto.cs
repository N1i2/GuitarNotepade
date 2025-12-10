public record UserProfileDto(
    Guid Id,
    string Email,
    string NikName,
    string Role,
    string? AvatarUrl,
    string? Bio,
    DateTime CreateAt,
    bool IsBlocked);