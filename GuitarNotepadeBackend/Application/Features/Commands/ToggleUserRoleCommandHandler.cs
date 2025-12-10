using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands;

public class ToggleUserRoleCommandHandler : IRequestHandler<ToggleUserRoleCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public ToggleUserRoleCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(ToggleUserRoleCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException($"User with email '{request.Email}' not found");
        }

        if (user.Id == request.AdminId)
        {
            throw new InvalidOperationException("Admin cannot change their own role");
        }

        if (user.Role == Constants.Roles.Admin)
        {
            user.RemoveAdminRole();
        }
        else
        {
            user.MakeAdminRole();
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return user.Id;
    }
}