using Application.DTOs;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Queries;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, UserProfileDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebDavService _webDavService;

    public GetCurrentUserQueryHandler(
        IUnitOfWork unitOfWork,
        IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _webDavService = webDavService;
    }

    public async Task<UserProfileDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        if (user.IsBlocked)
        {
            throw new UnauthorizedAccessException("User is blocked");
        }

        string? avatarBase64 = null;
        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            try
            {
                var avatarBytes = await _webDavService.GetAvatarBytesAsync(user.AvatarUrl);
                avatarBase64 = Convert.ToBase64String(avatarBytes);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
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
            user.CreateAt,
            user.IsBlocked);
    }
}