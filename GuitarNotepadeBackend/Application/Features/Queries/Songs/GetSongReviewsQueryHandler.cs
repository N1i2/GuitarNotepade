using Application.DTOs.Generic;
using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongReviewsQueryHandler : IRequestHandler<GetSongReviewsQuery, PaginatedDto<SongReviewDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongReviewService _songReviewService;
    private readonly IMapper _mapper;

    public GetSongReviewsQueryHandler(
        IUnitOfWork unitOfWork,
        ISongReviewService songReviewService,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _songReviewService = songReviewService;
        _mapper = mapper;
    }

    public async Task<PaginatedDto<SongReviewDto>> Handle(GetSongReviewsQuery request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new ArgumentException("Song not found", nameof(request.SongId));
        }

        var reviews = await _songReviewService.GetSongReviewsAsync(
            songId: request.SongId,
            page: request.Page,
            pageSize: request.PageSize,
            sortBy: request.SortBy,
            descending: request.Descending,
            cancellationToken: cancellationToken);

        var allReviews = await _unitOfWork.SongReviews.GetBySongIdAsync(request.SongId, cancellationToken);
        var totalCount = allReviews.Count;

        var reviewDtos = _mapper.Map<List<SongReviewDto>>(reviews);

        return PaginatedDto<SongReviewDto>.Create(
            reviewDtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}

