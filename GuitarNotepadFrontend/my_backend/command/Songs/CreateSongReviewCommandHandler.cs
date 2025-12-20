using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class CreateSongReviewCommandHandler : IRequestHandler<CreateSongReviewCommand, SongReviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ISongReviewService _songReviewService;

    public CreateSongReviewCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ISongReviewService songReviewService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _songReviewService = songReviewService;
    }

    public async Task<SongReviewDto> Handle(CreateSongReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _songReviewService.CreateReviewAsync(
            request.SongId,
            request.UserId,
            request.ReviewText,
            request.BeautifulLevel,
            request.DifficultyLevel,
            cancellationToken);

        var fullReview = await _unitOfWork.SongReviews.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.Song)
            .Include(r => r.Likes)
            .FirstOrDefaultAsync(r => r.Id == review.Id, cancellationToken);

        var dto = _mapper.Map<SongReviewDto>(fullReview);

        var userLike = fullReview?.Likes.FirstOrDefault(l => l.UserId == request.UserId);
        if (userLike != null)
        {
            dto.CurrentUserLike = userLike.IsLike;
        }

        return dto;
    }
}