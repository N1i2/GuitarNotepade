using Application.DTOs.Generic;
using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSongCommentsQueryHandler : IRequestHandler<GetSongCommentsQuery, PaginatedDto<SongCommentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSongCommentsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedDto<SongCommentDto>> Handle(GetSongCommentsQuery request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(request.SongId));

        var query = _unitOfWork.SongComments.GetQueryable()
            .Include(c => c.Song)
                .ThenInclude(s => s.Owner)
            .Include(c => c.Segment)
            .Where(c => c.SongId == request.SongId);

        if (request.SegmentId.HasValue)
        {
            query = query.Where(c => c.SegmentId == request.SegmentId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var comments = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var commentDtos = _mapper.Map<List<SongCommentDto>>(comments);

        return PaginatedDto<SongCommentDto>.Create(
            commentDtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}

