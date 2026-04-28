using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class SearchSongsQueryHandler : IRequestHandler<SearchSongsQuery, SongSearchResultDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SearchSongsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongSearchResultDto> Handle(SearchSongsQuery request, CancellationToken cancellationToken)
    {
        var filters = request.Filters;
        var query = _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.Structure)
            .Include(s => s.SongChords)
                .ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns)
                .ThenInclude(sp => sp.StrummingPattern)
            .Include(s => s.Reviews)
            .Include(s => s.Comments)
            .AsQueryable();

        if (filters.UserId.HasValue)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(filters.UserId.Value, cancellationToken);
            if (user?.Role != Constants.Roles.Admin)
            {
                query = query.Where(s => s.IsPublic || s.OwnerId == filters.UserId.Value);
            }
        }
        else
        {
            query = query.Where(s => s.IsPublic);
        }

        if (filters.IsPublic.HasValue)
        {
            query = query.Where(s => s.IsPublic == filters.IsPublic.Value);
        }

        if (filters.OwnerId.HasValue)
        {
            query = query.Where(s => s.OwnerId == filters.OwnerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filters.SearchTerm))
        {
            var searchTerm = filters.SearchTerm.ToLower();
            query = query.Where(s =>
                s.FullText.ToLower().Contains(searchTerm) ||
                s.Title.ToLower().Contains(searchTerm) ||
                (s.Artist != null && s.Artist.ToLower().Contains(searchTerm)) ||
                (s.Description != null && s.Description.ToLower().Contains(searchTerm)));
        }

        if (filters.ChordId.HasValue)
        {
            query = query.Where(s => s.SongChords.Any(sc => sc.ChordId == filters.ChordId.Value));
        }

        if (filters.PatternId.HasValue)
        {
            query = query.Where(s => s.SongPatterns.Any(sp => sp.StrummingPatternId == filters.PatternId.Value));
        }

        if (filters.MinRating.HasValue || filters.MaxRating.HasValue)
        {
            if (filters.MinRating.HasValue && filters.MaxRating.HasValue)
            {
                query = query.Where(s =>
                    s.Reviews
                        .Where(r => r.BeautifulLevel.HasValue)
                        .Select(r => (decimal?)r.BeautifulLevel!.Value)
                        .Average().HasValue &&
                    s.Reviews
                        .Where(r => r.BeautifulLevel.HasValue)
                        .Select(r => (decimal?)r.BeautifulLevel!.Value)
                        .Average() >= (decimal)filters.MinRating.Value &&
                    s.Reviews
                        .Where(r => r.BeautifulLevel.HasValue)
                        .Select(r => (decimal?)r.BeautifulLevel!.Value)
                        .Average() <= (decimal)filters.MaxRating.Value);
            }
            else if (filters.MinRating.HasValue)
            {
                query = query.Where(s =>
                    s.Reviews
                        .Where(r => r.BeautifulLevel.HasValue)
                        .Select(r => (decimal?)r.BeautifulLevel!.Value)
                        .Average().HasValue &&
                    s.Reviews
                        .Where(r => r.BeautifulLevel.HasValue)
                        .Select(r => (decimal?)r.BeautifulLevel!.Value)
                        .Average() >= (decimal)filters.MinRating.Value);
            }
            else if (filters.MaxRating.HasValue)
            {
                query = query.Where(s =>
                    s.Reviews
                        .Where(r => r.BeautifulLevel.HasValue)
                        .Select(r => (decimal?)r.BeautifulLevel!.Value)
                        .Average().HasValue &&
                    s.Reviews
                        .Where(r => r.BeautifulLevel.HasValue)
                        .Select(r => (decimal?)r.BeautifulLevel!.Value)
                        .Average() <= (decimal)filters.MaxRating.Value);
            }
        }

        if (filters.CreatedFrom.HasValue)
        {
            query = query.Where(s => s.CreatedAt >= filters.CreatedFrom.Value);
        }

        if (filters.CreatedTo.HasValue)
        {
            query = query.Where(s => s.CreatedAt <= filters.CreatedTo.Value);
        }

        query = ApplySorting(query, filters.SortBy, filters.SortOrder);

        var totalCount = await query.CountAsync(cancellationToken);

        var songs = await query
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .ToListAsync(cancellationToken);

        var songDtos = _mapper.Map<List<SongDto>>(songs);
        for (var i = 0; i < songs.Count; i++)
        {
            var currentSong = songs[i];
            songDtos[i].AverageBeautifulRating = currentSong.Reviews
                .Where(r => r.BeautifulLevel.HasValue)
                .Select(r => (decimal?)r.BeautifulLevel!.Value)
                .Average();
            songDtos[i].AverageDifficultyRating = currentSong.Reviews
                .Where(r => r.DifficultyLevel.HasValue)
                .Select(r => (decimal?)r.DifficultyLevel!.Value)
                .Average();
            songDtos[i].ReviewCount = currentSong.Reviews.Count;
        }

        return new SongSearchResultDto
        {
            Songs = songDtos,
            TotalCount = totalCount,
            Page = filters.Page,
            PageSize = filters.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filters.PageSize)
        };
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

            "createdat" => isAscending
                ? query.OrderBy(s => s.CreatedAt)
                : query.OrderByDescending(s => s.CreatedAt),

            "updatedat" => isAscending
                ? query.OrderBy(s => s.UpdatedAt ?? s.CreatedAt)
                : query.OrderByDescending(s => s.UpdatedAt ?? s.CreatedAt),

            "reviews" => isAscending
                ? query.OrderBy(s => s.ReviewCount)
                : query.OrderByDescending(s => s.ReviewCount),

            "rating" => isAscending
                ? query.OrderBy(s => s.Reviews
                    .Where(r => r.BeautifulLevel.HasValue)
                    .Select(r => (decimal?)r.BeautifulLevel!.Value)
                    .Average() ?? 0)
                : query.OrderByDescending(s => s.Reviews
                    .Where(r => r.BeautifulLevel.HasValue)
                    .Select(r => (decimal?)r.BeautifulLevel!.Value)
                    .Average() ?? 0),

            "artist" => isAscending
                ? query.OrderBy(s => s.Artist ?? "")
                : query.OrderByDescending(s => s.Artist ?? ""),

            _ => query.OrderByDescending(s => s.CreatedAt)
        };
    }
}

