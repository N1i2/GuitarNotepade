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
            .Include(s => s.User)
            .Where(s => s.UserId == request.UserId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<SubscriptionDto>>(subscriptions);

        // Заполняем имена объектов подписки
        foreach (var sub in result)
        {
            if (sub.IsUserSub)
            {
                var targetUser = await _unitOfWork.Users.GetByIdAsync(sub.SubId, cancellationToken);
                sub.SubName = targetUser?.NikName ?? "Unknown User";
            }
            else
            {
                var album = await _unitOfWork.Alboms.GetByIdAsync(sub.SubId, cancellationToken);
                sub.SubName = album?.Title ?? "Unknown Album";
            }
        }

        return result;
    }
}