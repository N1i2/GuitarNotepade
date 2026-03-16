using Application.DTOs.Notifications;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Notifications;

public class GetUserNotificationsQueryHandler
    : IRequestHandler<GetUserNotificationsQuery, List<NotificationDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetUserNotificationsQueryHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<NotificationDto>> Handle(
        GetUserNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Notifications
            .GetQueryable()
            .Where(n => n.UserId == request.UserId)
            .OrderByDescending(n => n.CreatedAt)
            .AsQueryable();

        if (request.Skip > 0)
        {
            query = query.Skip(request.Skip);
        }

        if (request.Take > 0)
        {
            query = query.Take(request.Take);
        }

        var notifications = await query.ToListAsync(cancellationToken);
        return _mapper.Map<List<NotificationDto>>(notifications);
    }
}

