using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands;

public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand, UserProfileDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateUserProfileCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UserProfileDto> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);

        if (user == null)
        {
            throw new Exception("User not found");
        }

        if (!string.IsNullOrEmpty(request.NikName) && request.NikName != user.NikName)
        {
            var existingUser = await _unitOfWork.Users.GetByNikNameAsync(request.NikName, cancellationToken);
            if (existingUser != null && existingUser.Id != request.UserId)
            {
                throw new Exception("Nickname is already taken");
            }

            user.UpdateProfile(request.NikName, request.Bio);
        }
        else if (!string.IsNullOrEmpty(request.Bio) && request.Bio != user.Bio)
        {
            user.UpdateProfile(null, request.Bio);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

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