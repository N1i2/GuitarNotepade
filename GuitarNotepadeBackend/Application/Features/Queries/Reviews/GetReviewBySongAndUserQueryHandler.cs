using Application.DTOs.Reviews;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Reviews;

public class GetReviewBySongAndUserQueryHandler : IRequestHandler<GetReviewBySongAndUserQuery, SongReviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetReviewBySongAndUserQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongReviewDto> Handle(
        GetReviewBySongAndUserQuery request,
        CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.Song)
            .Include(r => r.Likes)
            .FirstOrDefaultAsync(r => r.SongId == request.SongId && r.UserId == request.UserId, cancellationToken);

        if (review == null)
        {
            throw new KeyNotFoundException($"Review not found for song {request.SongId} by user {request.UserId}");
        }

        return _mapper.Map<SongReviewDto>(review);
    }
}