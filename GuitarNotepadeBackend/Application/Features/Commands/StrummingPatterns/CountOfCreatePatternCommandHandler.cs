using Domain.Interfaces;
using Domain.Interfaces.Services;
using Domain.Common;
using MediatR;

namespace Application.Features.Commands.StrummingPatterns;

public class CountOfCreatePatternCommandHandler : IRequestHandler<CountOfCreatePatternCommand, int>
{
    private readonly IUnitOfWork _unitOfWork;
    public readonly IUserService _userService;

    public CountOfCreatePatternCommandHandler(IUnitOfWork unitOfWork, IUserService userService)
    {
        _unitOfWork = unitOfWork;
        _userService = userService;
    }

    public async Task<int> Handle(CountOfCreatePatternCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.userId, cancellationToken);

        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(request.userId));
        }

        if (user.IsGuest)
        {
            return 0;
        }
        if (user.HasPremium || user.IsAdmin)
        {
            return -1;
        }

        var count = await _userService.GetUserPatternsCountAsync(request.userId, cancellationToken);

        return Constants.Limits.FreeUserMaxPatterns - count;
    }
}
