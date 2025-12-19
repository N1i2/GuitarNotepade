using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class UpdateReviewLikeCommandHandler : IRequestHandler<UpdateReviewLikeCommand, ReviewLikeDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ISongReviewService _songReviewService;

    public UpdateReviewLikeCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ISongReviewService songReviewService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _songReviewService = songReviewService;
    }

    public async Task<ReviewLikeDto> Handle(UpdateReviewLikeCommand request, CancellationToken cancellationToken)
    {
        var like = await _unitOfWork.ReviewLikes.GetByIdAsync(request.LikeId, cancellationToken);
        if (like == null)
            throw new ArgumentException("Like not found", nameof(request.LikeId));

        if (like.UserId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to update this like");

        var updatedLike = await _songReviewService.UpdateReviewLikeAsync(
            like.ReviewId,
            request.UserId,
            request.IsLike,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var fullLike = await _unitOfWork.ReviewLikes.GetQueryable()
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Id == updatedLike.Id, cancellationToken);

        return _mapper.Map<ReviewLikeDto>(fullLike);
    }
}

