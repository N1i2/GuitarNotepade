using Application.DTOs.Generic;
using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSongReviewsQueryHandler : IRequestHandler<GetSongReviewsQuery, PaginatedDto<SongReviewDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ISongReviewService _songReviewService;

    public GetSongReviewsQueryHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ISongReviewService songReviewService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _songReviewService = songReviewService;
    }

    public async Task<PaginatedDto<SongReviewDto>> Handle(GetSongReviewsQuery request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(request.SongId));

        var reviews = await _songReviewService.GetSongReviewsAsync(
            request.SongId,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.Descending,
            cancellationToken);

        var totalCount = await _unitOfWork.SongReviews.CountBySongIdAsync(request.SongId, cancellationToken);

        var reviewIds = reviews.Select(r => r.Id).ToList();
        var fullReviews = await _unitOfWork.SongReviews.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.Likes)
            .Where(r => reviewIds.Contains(r.Id))
            .ToListAsync(cancellationToken);

        var reviewDtos = fullReviews.Select(review =>
        {
            var dto = _mapper.Map<SongReviewDto>(review);
            return dto;
        }).ToList();

        return PaginatedDto<SongReviewDto>.Create(
            reviewDtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}

