using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Songs;

public class CreateSongReviewCommandHandler : IRequestHandler<CreateSongReviewCommand, SongReviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongReviewService _songReviewService;
    private readonly ISongService _songService;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateSongReviewCommandHandler> _logger;

    public CreateSongReviewCommandHandler(
        IUnitOfWork unitOfWork,
        ISongReviewService songReviewService,
        ISongService songService,
        IMapper mapper,
        ILogger<CreateSongReviewCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _songReviewService = songReviewService;
        _songService = songService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<SongReviewDto> Handle(CreateSongReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _songReviewService.CreateReviewAsync(
            songId: request.SongId,
            userId: request.UserId,
            reviewText: request.ReviewText,
            beautifulLevel: request.BeautifulLevel,
            difficultyLevel: request.DifficultyLevel,
            cancellationToken: cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _songService.UpdateSongStatisticsAsync(request.SongId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var reviewWithDetails = await _unitOfWork.SongReviews.GetByIdAsync(review.Id, cancellationToken);
        if (reviewWithDetails == null)
        {
            throw new KeyNotFoundException("Review not found after creation");
        }

        _logger.LogInformation("Review created successfully: {ReviewId} for song {SongId} by user {UserId}",
            review.Id, request.SongId, request.UserId);

        return _mapper.Map<SongReviewDto>(reviewWithDetails);
    }
}

