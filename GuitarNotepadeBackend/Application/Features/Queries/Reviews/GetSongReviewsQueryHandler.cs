using Application.DTOs.Generic;
using Application.DTOs.Reviews;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Reviews;

public class GetSongReviewsQueryHandler : IRequestHandler<GetSongReviewsQuery, PaginatedDto<SongReviewDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSongReviewsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedDto<SongReviewDto>> Handle(
        GetSongReviewsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _unitOfWork.SongReviews.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.Song)
            .Include(r => r.Likes)
            .Where(r => r.SongId == request.SongId);

        query = request.SortBy.ToLower() switch
        {
            "rating" => request.SortOrder.ToLower() == "asc"
                ? query.OrderBy(r => r.BeautifulLevel ?? 0)
                : query.OrderByDescending(r => r.BeautifulLevel ?? 0),

            "date" or "createdat" => request.SortOrder.ToLower() == "asc"
                ? query.OrderBy(r => r.CreatedAt)
                : query.OrderByDescending(r => r.CreatedAt),

            "popular" => request.SortOrder.ToLower() == "asc"
                ? query.OrderBy(r => r.LikesCount + r.DislikesCount)
                : query.OrderByDescending(r => r.LikesCount + r.DislikesCount),

            _ => query.OrderByDescending(r => r.CreatedAt)
        };

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