using Domain.Interfaces;
using MediatR;

namespace Application.Features.Queries.Users;

public class GetUserByEmailQueryHandler : IRequestHandler<GetUserByEmailQuery, UserProfileDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUserByEmailQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UserProfileDto> Handle(GetUserByEmailQuery request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.email, cancellationToken);

        if (user == null)
        {
            throw new Exception("User not found");
        }

        return new UserProfileDto(
          user.Id,
          user.Email,
          user.NikName,
          user.Role,
          user.HasPremium,
          user.AvatarUrl,
          user.Bio,
          user.CreateAt,
          user.IsBlocked,
          user.BlockedUntil,
          user.BlockReason);
    }
}
