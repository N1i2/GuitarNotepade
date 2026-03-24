public record UserProfileDto(
    Guid Id,
    string Email,
    string NikName,
    string Role,
    bool HasPremium,
    string? AvatarUrl,
    string? Bio,
    DateTime CreateAt,
    bool IsBlocked,
    DateTime? BlockedUntil,
    string? BlockReason);
