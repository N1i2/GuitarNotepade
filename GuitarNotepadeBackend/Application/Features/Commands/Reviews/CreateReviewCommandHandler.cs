using Application.DTOs.Reviews;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Reviews;

public class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, SongReviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateReviewCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongReviewDto> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException($"Song with ID {request.SongId} not found");
        }

        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {request.UserId} not found");
        }

        if (user.IsBlocked)
        {
            throw new InvalidOperationException("User is blocked and cannot create reviews");
        }

        if (song.OwnerId == request.UserId)
        {
            throw new InvalidOperationException("You cannot review your own song");
        }

        if (!song.IsPublic)
        {
            throw new InvalidOperationException("Cannot review private song");
        }

        var existingReview = await _unitOfWork.SongReviews.GetBySongAndUserAsync(
            request.SongId, request.UserId, cancellationToken);
        if (existingReview != null)
        {
            throw new InvalidOperationException("You have already reviewed this song");
        }

        var review = SongReview.Create(
            request.SongId,
            request.UserId,
            request.ReviewText,
            request.BeautifulLevel,
            request.DifficultyLevel);

        await _unitOfWork.SongReviews.CreateAsync(review, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var reviewWithRelations = await _unitOfWork.SongReviews.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.Song)
            .FirstOrDefaultAsync(r => r.Id == review.Id, cancellationToken);

        if (reviewWithRelations == null)
        {
            throw new InvalidOperationException("Failed to create review");
        }

        return _mapper.Map<SongReviewDto>(reviewWithRelations);
    }
}