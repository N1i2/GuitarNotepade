using Application.DTOs.Generic;
using Application.DTOs.Reviews;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Reviews;

public class GetUserReviewsQueryHandler : IRequestHandler<GetUserReviewsQuery, PaginatedDto<SongReviewDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetUserReviewsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedDto<SongReviewDto>> Handle(
        GetUserReviewsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _unitOfWork.SongReviews.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.Song)
            .Include(r => r.Likes)
            .Where(r => r.UserId == request.UserId)
            .OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var reviews = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var reviewDtos = _mapper.Map<List<SongReviewDto>>(reviews);

        return PaginatedDto<SongReviewDto>.Create(
            reviewDtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}