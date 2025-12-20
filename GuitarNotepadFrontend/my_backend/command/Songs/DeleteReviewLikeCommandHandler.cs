using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.Songs;

public class DeleteReviewLikeCommandHandler : IRequestHandler<DeleteReviewLikeCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongReviewService _songReviewService;

    public DeleteReviewLikeCommandHandler(
        IUnitOfWork unitOfWork,
        ISongReviewService songReviewService)
    {
        _unitOfWork = unitOfWork;
        _songReviewService = songReviewService;
    }

    public async Task<bool> Handle(DeleteReviewLikeCommand request, CancellationToken cancellationToken)
    {
        var like = await _unitOfWork.ReviewLikes.GetByIdAsync(request.LikeId, cancellationToken);
        if (like == null)
            throw new ArgumentException("Like not found", nameof(request.LikeId));

        if (like.UserId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to delete this like");

        await _songReviewService.RemoveReviewLikeAsync(
            like.ReviewId,
            request.UserId,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

