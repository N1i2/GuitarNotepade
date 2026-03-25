using Domain.Interfaces;
using MediatR;

namespace Application.Features.Queries.Subscriptions;

public class GetUserSubscriptionsCountQueryHandler : IRequestHandler<GetUserSubscriptionsCountQuery, int>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUserSubscriptionsCountQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<int> Handle(GetUserSubscriptionsCountQuery request, CancellationToken cancellationToken)
    {
        return await _unitOfWork.Subscriptions.CountUserSubscriptionsAsync(request.UserId, cancellationToken);
    }
}
