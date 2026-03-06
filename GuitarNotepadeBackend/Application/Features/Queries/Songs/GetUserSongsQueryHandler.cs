using Application.DTOs.Generic;
using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetUserSongsQueryHandler : IRequestHandler<GetUserSongsQuery, PaginatedDto<SongDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetUserSongsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedDto<SongDto>> Handle(GetUserSongsQuery request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(request.UserId));
        }

        var query = _unitOfWork.Songs.GetQueryable()
            .Where(s => s.OwnerId == request.UserId)
            .Include(s => s.Owner)
            .Include(s => s.Structure)
            .Include(s => s.SongChords)
                .ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns)
                .ThenInclude(sp => sp.StrummingPattern)
            .Include(s => s.Reviews)
            .Include(s => s.Comments)
            .AsQueryable();

        if (!request.IncludePrivate)
        {
            query = query.Where(s => s.IsPublic);
        }

        query = query.OrderByDescending(s => s.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var songs = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var songDtos = _mapper.Map<List<SongDto>>(songs);

        return PaginatedDto<SongDto>.Create(
            songDtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}

