using Domain.Interfaces;
using Domain.Common;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.Subscriptions;

public class CountOfCreateSubscriptionCommandHandler:IRequestHandler<CountOfCreateSubscriptionCommand, int>
{
    public readonly IUnitOfWork _unitOfWork;
    public readonly IUserService _userService;

    public CountOfCreateSubscriptionCommandHandler(IUnitOfWork unitOfWork, IUserService userService)
    {
        _unitOfWork = unitOfWork;
        _userService = userService;
    }

    public async Task<int> Handle(CountOfCreateSubscriptionCommand request, CancellationToken cancellationToken)
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

        var count = await _userService.GetUserSubscriptionsCountAsync(request.userId, cancellationToken);

        return Constants.Limits.FreeUserMaxSubscriptions - count;
    }
}
