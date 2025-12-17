using Application.DTOs.Generic;
using Application.DTOs.Songs;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class SearchSongsQueryHandler : IRequestHandler<SearchSongsQuery, PaginatedDto<SongDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SearchSongsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedDto<SongDto>> Handle(SearchSongsQuery request, CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Songs.GetQueryable();

        query = ApplyFilters(query, request.Filters);

        var totalCount = await query.CountAsync(cancellationToken);

        query = ApplySorting(query, request.Filters.SortBy, request.Filters.SortOrder);

        query = query
            .Include(s => s.Owner)
            .Include(s => s.Reviews);

        var songs = await query
            .Skip((request.Filters.Page - 1) * request.Filters.PageSize)
            .Take(request.Filters.PageSize)
            .ToListAsync(cancellationToken);

        var songDtos = _mapper.Map<List<SongDto>>(songs);

        return PaginatedDto<SongDto>.Create(
            songDtos,
            totalCount,
            request.Filters.Page,
            request.Filters.PageSize);
    }

    private IQueryable<Domain.Entities.Song> ApplyFilters(
        IQueryable<Domain.Entities.Song> query,
        SongFiltersDto filters)
    {
        if (!filters.OwnerId.HasValue && !filters.MySongsOnly.GetValueOrDefault())
        {
            query = query.Where(s => s.IsPublic);
        }

        if (!string.IsNullOrEmpty(filters.Search))
        {
            var searchTerm = filters.Search.ToLower();
            query = query.Where(s =>
                s.Title.ToLower().Contains(searchTerm) ||
                s.FullText.ToLower().Contains(searchTerm) ||
                (s.Artist != null && s.Artist.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrEmpty(filters.Title))
        {
            query = query.Where(s => s.Title.Contains(filters.Title));
        }

        if (!string.IsNullOrEmpty(filters.Artist))
        {
            query = query.Where(s => s.Artist != null && s.Artist.Contains(filters.Artist));
        }

        if (filters.IsPublic.HasValue)
        {
            query = query.Where(s => s.IsPublic == filters.IsPublic.Value);
        }

        if (filters.OwnerId.HasValue)
        {
            query = query.Where(s => s.OwnerId == filters.OwnerId.Value);
        }

        if (filters.ChordId.HasValue)
        {
            query = query.Where(s => s.SongChords.Any(sc => sc.ChordId == filters.ChordId.Value));
        }

        if (filters.PatternId.HasValue)
        {
            query = query.Where(s => s.SongPatterns.Any(sp => sp.StrummingPatternId == filters.PatternId.Value));
        }

        if (filters.MySongsOnly.GetValueOrDefault() && filters.OwnerId.HasValue)
        {
            query = query.Where(s => s.OwnerId == filters.OwnerId.Value);
        }

        return query;
    }

    private IQueryable<Domain.Entities.Song> ApplySorting(
        IQueryable<Domain.Entities.Song> query,
        string sortBy,
        string sortOrder)
    {
        var isAscending = sortOrder.ToLower() == "asc";

        return sortBy.ToLower() switch
        {
            "title" => isAscending
                ? query.OrderBy(s => s.Title)
                : query.OrderByDescending(s => s.Title),

            "artist" => isAscending
                ? query.OrderBy(s => s.Artist ?? "")
                : query.OrderByDescending(s => s.Artist ?? ""),

            "createdat" => isAscending
                ? query.OrderBy(s => s.CreatedAt)
                : query.OrderByDescending(s => s.CreatedAt),

            "updatedat" => isAscending
                ? query.OrderBy(s => s.UpdatedAt ?? s.CreatedAt)
                : query.OrderByDescending(s => s.UpdatedAt ?? s.CreatedAt),

            "rating" => isAscending
                ? query.OrderBy(s => s.Reviews
                    .Where(r => r.BeautifulLevel.HasValue)
                    .Average(r => r.BeautifulLevel ?? 0))
                : query.OrderByDescending(s => s.Reviews
                    .Where(r => r.BeautifulLevel.HasValue)
                    .Average(r => r.BeautifulLevel ?? 0)),

            _ => query.OrderByDescending(s => s.CreatedAt)
        };
    }
}