using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class UpdateSongReviewCommandHandler : IRequestHandler<UpdateSongReviewCommand, SongReviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ISongReviewService _songReviewService;

    public UpdateSongReviewCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ISongReviewService songReviewService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _songReviewService = songReviewService;
    }

    public async Task<SongReviewDto> Handle(UpdateSongReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(request.ReviewId, cancellationToken);
        if (review == null)
            throw new ArgumentException("Review not found", nameof(request.ReviewId));

        if (review.UserId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to update this review");

        var updatedReview = await _songReviewService.UpdateReviewAsync(
            request.ReviewId,
            request.ReviewText,
            request.BeautifulLevel,
            request.DifficultyLevel,
            cancellationToken);

        var song = await _unitOfWork.Songs.GetByIdAsync(updatedReview.SongId, cancellationToken);
        if (song != null)
        {
            song.UpdateStatistics();
            await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var fullReview = await _unitOfWork.SongReviews.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.Likes)
            .FirstOrDefaultAsync(r => r.Id == updatedReview.Id, cancellationToken);

        var dto = _mapper.Map<SongReviewDto>(fullReview);

        var userLike = fullReview?.Likes.FirstOrDefault(l => l.UserId == request.UserId);
        if (userLike != null)
        {
            dto.CurrentUserLike = userLike.IsLike;
        }

        return dto;
    }
}

