using Application.DTOs.Subscriptions;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Subscriptions;

public class GetUserSubscriptionsWithAlbumsQueryHandler : IRequestHandler<GetUserSubscriptionsWithAlbumsQuery, List<SubscriptionWithAlbumDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetUserSubscriptionsWithAlbumsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<SubscriptionWithAlbumDto>> Handle(GetUserSubscriptionsWithAlbumsQuery request, CancellationToken cancellationToken)
    {
        var subscriptions = await _unitOfWork.Subscriptions
            .GetQueryable()
            .Include(s => s.Subscriber)
            .Include(s => s.TargetAlbum)
                .ThenInclude(a => a.Owner)
            .Include(s => s.TargetAlbum)
                .ThenInclude(a => a.SongAlbums)
            .Where(s => s.UserId == request.UserId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<SubscriptionWithAlbumDto>>(subscriptions);

        return result;
    }
}