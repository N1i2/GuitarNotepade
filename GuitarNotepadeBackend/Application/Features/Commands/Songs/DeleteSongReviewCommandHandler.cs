using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Songs;

public class DeleteSongReviewCommandHandler : IRequestHandler<DeleteSongReviewCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongReviewService _songReviewService;
    private readonly ISongService _songService;
    private readonly ILogger<DeleteSongReviewCommandHandler> _logger;

    public DeleteSongReviewCommandHandler(
        IUnitOfWork unitOfWork,
        ISongReviewService songReviewService,
        ISongService songService,
        ILogger<DeleteSongReviewCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _songReviewService = songReviewService;
        _songService = songService;
        _logger = logger;
    }

    public async Task Handle(DeleteSongReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(request.ReviewId, cancellationToken);
        if (review == null)
        {
            throw new KeyNotFoundException("Review not found");
        }

        if (review.UserId != request.UserId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
            if (user?.Role != Domain.Common.Constants.Roles.Admin)
            {
                throw new UnauthorizedAccessException("You do not have permission to delete this review");
            }
        }

        var songId = review.SongId;

        await _songReviewService.DeleteReviewAsync(request.ReviewId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _songService.UpdateSongStatisticsAsync(songId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Review deleted successfully: {ReviewId} by user {UserId}",
            request.ReviewId, request.UserId);
    }
}

