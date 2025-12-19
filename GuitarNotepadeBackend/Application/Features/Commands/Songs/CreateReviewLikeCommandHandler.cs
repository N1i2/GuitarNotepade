using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class CreateReviewLikeCommandHandler : IRequestHandler<CreateReviewLikeCommand, ReviewLikeDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ISongReviewService _songReviewService;

    public CreateReviewLikeCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ISongReviewService songReviewService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _songReviewService = songReviewService;
    }

    public async Task<ReviewLikeDto> Handle(CreateReviewLikeCommand request, CancellationToken cancellationToken)
    {
        var like = await _songReviewService.ToggleReviewLikeAsync(
            request.ReviewId,
            request.UserId,
            request.IsLike,
            cancellationToken);

        var fullLike = await _unitOfWork.ReviewLikes.GetQueryable()
            .Include(l => l.User)
            .Include(l => l.Review)
            .FirstOrDefaultAsync(l => l.Id == like.Id, cancellationToken);

        return _mapper.Map<ReviewLikeDto>(fullLike);
    }
}