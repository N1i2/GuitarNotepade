using Application.DTOs.Reviews;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Reviews;

public class GetReviewByIdQueryHandler : IRequestHandler<GetReviewByIdQuery, SongReviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetReviewByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongReviewDto> Handle(
        GetReviewByIdQuery request,
        CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.Song)
            .Include(r => r.Likes)
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, cancellationToken);

        if (review == null)
        {
            throw new KeyNotFoundException($"Review with ID {request.ReviewId} not found");
        }

        return _mapper.Map<SongReviewDto>(review);
    }
}