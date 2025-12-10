using Domain.Interfaces;
using MediatR;

namespace Application.Features.Queries;

public class GetUserProfileQueryHandler : IRequestHandler<GetUserProfileQuery, UserProfileDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUserProfileQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UserProfileDto> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);

        if (user == null)
        {
            throw new Exception("User not found");
        }

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.NikName,
            user.Role,
            user.AvatarUrl,
            user.Bio,
            user.CreateAt,
            user.IsBlocked);
    }
}