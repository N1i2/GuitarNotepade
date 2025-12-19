using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.Songs;

public class DeleteSongReviewCommandHandler : IRequestHandler<DeleteSongReviewCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongReviewService _songReviewService;

    public DeleteSongReviewCommandHandler(
        IUnitOfWork unitOfWork,
        ISongReviewService songReviewService)
    {
        _unitOfWork = unitOfWork;
        _songReviewService = songReviewService;
    }

    public async Task<bool> Handle(DeleteSongReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(request.ReviewId, cancellationToken);
        if (review == null)
            throw new ArgumentException("Review not found", nameof(request.ReviewId));

        if (review.UserId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to delete this review");

        await _songReviewService.DeleteReviewAsync(request.ReviewId, cancellationToken);

        var song = await _unitOfWork.Songs.GetByIdAsync(review.SongId, cancellationToken);
        if (song != null)
        {
            song.UpdateStatistics();
            await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

