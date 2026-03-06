using Application.DTOs.Generic;
using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetUserReviewsQueryHandler : IRequestHandler<GetUserReviewsQuery, PaginatedDto<SongReviewDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongReviewService _songReviewService;
    private readonly IMapper _mapper;

    public GetUserReviewsQueryHandler(
        IUnitOfWork unitOfWork,
        ISongReviewService songReviewService,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _songReviewService = songReviewService;
        _mapper = mapper;
    }

    public async Task<PaginatedDto<SongReviewDto>> Handle(GetUserReviewsQuery request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(request.UserId));
        }

        var reviews = await _songReviewService.GetUserReviewsAsync(
            userId: request.UserId,
            page: request.Page,
            pageSize: request.PageSize,
            cancellationToken: cancellationToken);

        var allReviews = await _unitOfWork.SongReviews.GetByUserIdAsync(request.UserId, cancellationToken);
        var totalCount = allReviews.Count;

        var reviewDtos = _mapper.Map<List<SongReviewDto>>(reviews);

        return PaginatedDto<SongReviewDto>.Create(
            reviewDtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}

