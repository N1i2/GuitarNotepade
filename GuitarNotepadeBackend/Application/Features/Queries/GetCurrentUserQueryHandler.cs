

using Domain.Interfaces;
using MediatR;

namespace Application.Features.Queries;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, UserProfileDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetCurrentUserQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.NikName,
            user.Role,
            user.AvatarUrl,
            user.Bio,
            user.CreateAt);
    }
}