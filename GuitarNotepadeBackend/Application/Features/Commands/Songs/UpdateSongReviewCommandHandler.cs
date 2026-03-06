using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Songs;

public class UpdateSongReviewCommandHandler : IRequestHandler<UpdateSongReviewCommand, SongReviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongReviewService _songReviewService;
    private readonly ISongService _songService;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateSongReviewCommandHandler> _logger;

    public UpdateSongReviewCommandHandler(
        IUnitOfWork unitOfWork,
        ISongReviewService songReviewService,
        ISongService songService,
        IMapper mapper,
        ILogger<UpdateSongReviewCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _songReviewService = songReviewService;
        _songService = songService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<SongReviewDto> Handle(UpdateSongReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(request.ReviewId, cancellationToken);

        if (review == null)
        {
            throw new KeyNotFoundException("Review not found");
        }

        if (review.UserId != request.UserId)
        {
            throw new UnauthorizedAccessException("You do not have permission to update this review");
        }

        var updatedReview = await _songReviewService.UpdateReviewAsync(
            reviewId: request.ReviewId,
            reviewText: request.ReviewText,
            beautifulLevel: request.BeautifulLevel,
            difficultyLevel: request.DifficultyLevel,
            cancellationToken: cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _songService.UpdateSongStatisticsAsync(review.SongId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var reviewWithDetails = await _unitOfWork.SongReviews.GetByIdAsync(request.ReviewId, cancellationToken);
        if (reviewWithDetails == null)
        {
            throw new KeyNotFoundException("Review not found after update");
        }

        _logger.LogInformation("Review updated successfully: {ReviewId}", request.ReviewId);

        return _mapper.Map<SongReviewDto>(reviewWithDetails);
    }
}

