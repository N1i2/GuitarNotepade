using Domain.Interfaces;
using MediatR;

namespace Application.Features.Queries.Subscriptions;

public class CheckSubscriptionQueryHandler : IRequestHandler<CheckSubscriptionQuery, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public CheckSubscriptionQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(CheckSubscriptionQuery request, CancellationToken cancellationToken)
    {
        return await _unitOfWork.Subscriptions.ExistsAsync(
            request.UserId,
            request.SubId,
            request.IsUserSub,
            cancellationToken);
    }
}