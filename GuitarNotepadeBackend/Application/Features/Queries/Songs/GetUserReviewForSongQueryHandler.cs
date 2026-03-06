using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetUserReviewForSongQueryHandler : IRequestHandler<GetUserReviewForSongQuery, SongReviewDto?>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongReviewService _songReviewService;
    private readonly IMapper _mapper;

    public GetUserReviewForSongQueryHandler(
        IUnitOfWork unitOfWork,
        ISongReviewService songReviewService,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _songReviewService = songReviewService;
        _mapper = mapper;
    }

    public async Task<SongReviewDto?> Handle(GetUserReviewForSongQuery request, CancellationToken cancellationToken)
    {
        var review = await _songReviewService.GetUserReviewForSongAsync(
            userId: request.UserId,
            songId: request.SongId,
            cancellationToken: cancellationToken);

        if (review == null)
        {
            return null;
        }

        return _mapper.Map<SongReviewDto>(review);
    }
}

