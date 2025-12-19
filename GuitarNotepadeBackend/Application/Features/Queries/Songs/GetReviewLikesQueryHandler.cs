using Application.DTOs.Generic;
using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetReviewLikesQueryHandler : IRequestHandler<GetReviewLikesQuery, PaginatedDto<ReviewLikeDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetReviewLikesQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedDto<ReviewLikeDto>> Handle(GetReviewLikesQuery request, CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(request.ReviewId, cancellationToken);
        if (review == null)
            throw new ArgumentException("Review not found", nameof(request.ReviewId));

        var query = _unitOfWork.ReviewLikes.GetQueryable()
            .Include(l => l.User)
            .Where(l => l.ReviewId == request.ReviewId);

        var totalCount = await query.CountAsync(cancellationToken);

        var likes = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var likeDtos = _mapper.Map<List<ReviewLikeDto>>(likes);

        return PaginatedDto<ReviewLikeDto>.Create(
            likeDtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}

