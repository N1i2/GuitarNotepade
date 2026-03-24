using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.Users;

public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand, UserProfileDto>
{
    private readonly IUserService _userService;
    private readonly IWebDavService _webDavService;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateUserProfileCommandHandler(
        IUserService userService,
        IWebDavService webDavService,
        IUnitOfWork unitOfWork)
    {
        _userService = userService;
        _webDavService = webDavService;
        _unitOfWork = unitOfWork;
    }

    public async Task<UserProfileDto> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _userService.GetByIdAsync(request.UserId, cancellationToken);

        if (user == null)
        {
            throw new Exception("User not found");
        }

        string? newAvatarFileName = null;
        bool avatarBase64WasProvided = request.GetType().GetProperty("AvatarBase64")?.GetValue(request) != null;

        if (avatarBase64WasProvided)
        {
            newAvatarFileName = await HandleAvatarUpdate(request, user, cancellationToken);
        }

        if (!string.IsNullOrEmpty(request.NikName) && request.NikName != user.NikName)
        {
            var existingUser = await _unitOfWork.Users.GetByNikNameAsync(request.NikName, cancellationToken);
            if (existingUser != null && existingUser.Id != request.UserId)
                throw new Exception("Nickname is already taken");
        }

        user.UpdateProfile(
            nikName: !string.IsNullOrEmpty(request.NikName) ? request.NikName : null,
            avatarUrl: avatarBase64WasProvided ? newAvatarFileName : null,
            bio: !string.IsNullOrEmpty(request.Bio) ? request.Bio : null);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        string? avatarBase64 = await GetAvatarBase64(user, cancellationToken);

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.NikName,
            user.Role,
            user.HasPremium,
            avatarBase64,
            user.Bio,
            user.CreateAt,
            user.IsBlocked,
            user.BlockedUntil,
            user.BlockReason);
    }

    private async Task<string?> HandleAvatarUpdate(UpdateUserProfileCommand request, Domain.Entities.User user, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.AvatarBase64))
        {
            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                await _webDavService.DeleteAvatarAsync(user.AvatarUrl);
            }
            return null;
        }
        else if (request.AvatarBase64.Length > 100 &&
                 (request.AvatarBase64.StartsWith("data:") ||
                  request.AvatarBase64.StartsWith("/9j/") ||
                  request.AvatarBase64.StartsWith("iVBORw")))
        {
            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                await _webDavService.DeleteAvatarAsync(user.AvatarUrl);
            }

            var base64Data = CleanBase64String(request.AvatarBase64);
            var fileExtension = GetFileExtensionFromBase64(request.AvatarBase64);
            var fileName = $"avatar_{user.Id}{fileExtension}";

            using var stream = new MemoryStream(Convert.FromBase64String(base64Data));
            return await _webDavService.UploadAvatarAsync(stream, fileName, user.Id);
        }

        return null;
    }

    private async Task<string?> GetAvatarBase64(Domain.Entities.User user, CancellationToken cancellationToken)
    {
        try
        {
            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                var avatarBytes = await _webDavService.GetAvatarBytesAsync(user.AvatarUrl);
                return Convert.ToBase64String(avatarBytes);
            }
        }
        catch (FileNotFoundException)
        {
        }

        var defaultBytes = await _webDavService.GetAvatarBytesAsync(null!);
        return Convert.ToBase64String(defaultBytes);
    }

    private string CleanBase64String(string base64)
    {
        if (base64.Contains(','))
            return base64.Split(',')[1];
        return base64;
    }

    private string GetFileExtensionFromBase64(string base64)
    {
        if (base64.StartsWith("data:image/jpeg;base64,") || base64.StartsWith("/9j/"))
            return ".jpg";
        if (base64.StartsWith("data:image/png;base64,") || base64.StartsWith("iVBORw"))
            return ".png";
        if (base64.StartsWith("data:image/gif;base64,") || base64.StartsWith("R0lGOD"))
            return ".gif";
        if (base64.StartsWith("data:image/webp;base64,"))
            return ".webp";

        return ".jpg";
    }
}
