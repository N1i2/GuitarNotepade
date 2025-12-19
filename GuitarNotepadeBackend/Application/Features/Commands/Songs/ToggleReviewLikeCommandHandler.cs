using Application.DTOs.Song;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class ToggleReviewLikeCommandHandler : IRequestHandler<ToggleReviewLikeCommand, ReviewLikeDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ISongReviewService _songReviewService;

    public ToggleReviewLikeCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ISongReviewService songReviewService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _songReviewService = songReviewService;
    }

    public async Task<ReviewLikeDto> Handle(ToggleReviewLikeCommand request, CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(request.ReviewId, cancellationToken);
        if (review == null)
            throw new ArgumentException("Review not found", nameof(request.ReviewId));

        var existingLike = await _unitOfWork.ReviewLikes.GetByReviewAndUserAsync(
            request.ReviewId,
            request.UserId,
            cancellationToken);

        ReviewLike like;

        if (existingLike != null)
        {
            var newIsLike = !existingLike.IsLike;
            like = await _songReviewService.UpdateReviewLikeAsync(
                request.ReviewId,
                request.UserId,
                newIsLike,
                cancellationToken);
        }
        else
        {
            like = await _songReviewService.ToggleReviewLikeAsync(
                request.ReviewId,
                request.UserId,
                true,
                cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var fullLike = await _unitOfWork.ReviewLikes.GetQueryable()
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Id == like.Id, cancellationToken);

        return _mapper.Map<ReviewLikeDto>(fullLike);
    }
}

