using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetReviewLikeByIdQueryHandler : IRequestHandler<GetReviewLikeByIdQuery, ReviewLikeDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetReviewLikeByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ReviewLikeDto> Handle(GetReviewLikeByIdQuery request, CancellationToken cancellationToken)
    {
        var like = await _unitOfWork.ReviewLikes.GetQueryable()
            .Include(l => l.User)
            .Include(l => l.Review)
            .FirstOrDefaultAsync(l => l.Id == request.LikeId, cancellationToken);

        if (like == null)
            throw new KeyNotFoundException("Like not found");

        return _mapper.Map<ReviewLikeDto>(like);
    }
}

