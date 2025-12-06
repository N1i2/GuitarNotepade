using Application.DTOs;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands;

public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand, UserProfileDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebDavService _webDavService;

    public UpdateUserProfileCommandHandler(
        IUnitOfWork unitOfWork,
        IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _webDavService = webDavService;
    }

    public async Task<UserProfileDto> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);

        if (user == null)
        {
            throw new Exception("User not found");
        }

        var oldAvatarFileName = user.AvatarUrl;
        string? newAvatarFileName = null;

        bool avatarBase64WasProvided = request.GetType().GetProperty("AvatarBase64")?.GetValue(request) != null;

        if (avatarBase64WasProvided)
        {
            if (string.IsNullOrEmpty(request.AvatarBase64))
            {
                if (!string.IsNullOrEmpty(oldAvatarFileName))
                {
                    try
                    {
                        await _webDavService.DeleteAvatarAsync(oldAvatarFileName);
                        Console.WriteLine($"Avatar deleted from Yandex.Disk: {oldAvatarFileName}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error deleting avatar from Yandex: {ex.Message}");
                    }
                }
                newAvatarFileName = null; 
                Console.WriteLine("Avatar marked for deletion (null/empty string provided)");
            }
            else if (request.AvatarBase64.Length > 100 &&
                    (request.AvatarBase64.StartsWith("data:") ||
                     request.AvatarBase64.StartsWith("/9j/") ||
                     request.AvatarBase64.StartsWith("iVBORw")))
            {
                if (!string.IsNullOrEmpty(oldAvatarFileName))
                {
                    try
                    {
                        await _webDavService.DeleteAvatarAsync(oldAvatarFileName);
                        Console.WriteLine($"Old avatar deleted: {oldAvatarFileName}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error deleting old avatar: {ex.Message}");
                    }
                }

                try
                {
                    var base64Data = CleanBase64String(request.AvatarBase64);
                    var fileExtension = GetFileExtensionFromBase64(request.AvatarBase64);
                    var fileName = $"avatar_{user.Id}{fileExtension}";

                    using var stream = new MemoryStream(Convert.FromBase64String(base64Data));
                    newAvatarFileName = await _webDavService.UploadAvatarAsync(stream, fileName, user.Id);
                    Console.WriteLine($"New avatar uploaded: {newAvatarFileName}");
                }
                catch (FormatException ex)
                {
                    Console.WriteLine($"Invalid base64 format: {ex.Message}");
                    throw new Exception("Invalid image format");
                }
            }
        }

        if (!string.IsNullOrEmpty(request.NikName) && request.NikName != user.NikName)
        {
            var existingUser = await _unitOfWork.Users.GetByNikNameAsync(request.NikName, cancellationToken);
            if (existingUser != null && existingUser.Id != request.UserId)
            {
                throw new Exception("Nickname is already taken");
            }
        }

        user.UpdateProfile(
            nikName: !string.IsNullOrEmpty(request.NikName) ? request.NikName : null,
            avatarUrl: avatarBase64WasProvided ? newAvatarFileName : null, 
            bio: !string.IsNullOrEmpty(request.Bio) ? request.Bio : null);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        Console.WriteLine($"Profile saved. AvatarUrl: {user.AvatarUrl ?? "null"}");

        string? avatarBase64 = null;

        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            try
            {
                var avatarBytes = await _webDavService.GetAvatarBytesAsync(user.AvatarUrl);
                avatarBase64 = Convert.ToBase64String(avatarBytes);
            }
            catch (FileNotFoundException)
            {
                var defaultBytes = await _webDavService.GetAvatarBytesAsync(null!);
                avatarBase64 = Convert.ToBase64String(defaultBytes);
            }
        }
        else
        {
            var defaultBytes = await _webDavService.GetAvatarBytesAsync(null!);
            avatarBase64 = Convert.ToBase64String(defaultBytes);
        }

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.NikName,
            user.Role,
            avatarBase64,
            user.Bio,
            user.CreateAt);
    }

    private string CleanBase64String(string base64)
    {
        if (base64.Contains(','))
        {
            return base64.Split(',')[1];
        }
        return base64;
    }

    private string GetFileExtensionFromBase64(string base64)
    {
        if (base64.StartsWith("data:image/jpeg;base64,") || base64.StartsWith("/9j/"))
        {
            return ".jpg";
        }
        if (base64.StartsWith("data:image/png;base64,") || base64.StartsWith("iVBORw"))
        {
            return ".png";
        }
        if (base64.StartsWith("data:image/gif;base64,") || base64.StartsWith("R0lGOD"))
        {
            return ".gif";
        }
        if (base64.StartsWith("data:image/webp;base64,"))
        {
            return ".webp";
        }

        return ".jpg";
    }
}