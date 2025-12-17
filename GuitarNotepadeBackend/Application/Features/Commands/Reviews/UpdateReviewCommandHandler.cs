using Application.DTOs.Reviews;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Reviews;

public class UpdateReviewCommandHandler : IRequestHandler<UpdateReviewCommand, SongReviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UpdateReviewCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongReviewDto> Handle(UpdateReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(request.ReviewId, cancellationToken);
        if (review == null)
        {
            throw new KeyNotFoundException($"Review with ID {request.ReviewId} not found");
        }

        if (review.UserId != request.UserId)
        {
            throw new UnauthorizedAccessException("You can only update your own reviews");
        }

        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
        if (user?.IsBlocked == true)
        {
            throw new InvalidOperationException("User is blocked and cannot update reviews");
        }

        review.Update(
            request.ReviewText,
            request.BeautifulLevel,
            request.DifficultyLevel);

        await _unitOfWork.SongReviews.UpdateAsync(review, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedReview = await _unitOfWork.SongReviews.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.Song)
            .Include(r => r.Likes)
            .FirstOrDefaultAsync(r => r.Id == review.Id, cancellationToken);

        return _mapper.Map<SongReviewDto>(updatedReview!);
    }
}