using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSongReviewByIdQueryHandler : IRequestHandler<GetSongReviewByIdQuery, SongReviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSongReviewByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongReviewDto> Handle(GetSongReviewByIdQuery request, CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.Song)
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, cancellationToken);

        if (review == null)
            throw new KeyNotFoundException("Review not found");

        return _mapper.Map<SongReviewDto>(review);
    }
}

