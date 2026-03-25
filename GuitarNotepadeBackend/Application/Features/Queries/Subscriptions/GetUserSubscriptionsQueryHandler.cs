using Application.DTOs.Subscriptions;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Subscriptions;

public class GetUserSubscriptionsQueryHandler : IRequestHandler<GetUserSubscriptionsQuery, List<SubscriptionDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetUserSubscriptionsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<SubscriptionDto>> Handle(GetUserSubscriptionsQuery request, CancellationToken cancellationToken)
    {
        var subscriptions = await _unitOfWork.Subscriptions
            .GetQueryable()
            .Include(s => s.Subscriber)
            .Include(s => s.TargetAlbum)
            .Where(s => s.UserId == request.UserId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<SubscriptionDto>>(subscriptions);

        foreach (var sub in result)
        {
            var subscription = subscriptions.First(s => s.Id == sub.Id);

            sub.TargetId = subscription.TargetAlbum?.Id ?? Guid.Empty;

            sub.UserName = subscription.Subscriber?.NikName ?? "Unknown User";
        }

        return result;
    }
}
