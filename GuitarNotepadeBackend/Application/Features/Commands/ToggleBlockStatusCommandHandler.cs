using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands;

public class ToggleBlockStatusCommandHandler : IRequestHandler<ToggleBlockStatusCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public ToggleBlockStatusCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(ToggleBlockStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException($"User with email '{request.Email}' not found");
        }
        if(user.Id == request.adminId)
        {
            throw new KeyNotFoundException($"Admin can't block/unblock himself");
        }

        if (!user.IsBlocked)
        {
            user.Block();
        }
        else
        {
            user.Unblock();
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return user.Id;
    }
}
