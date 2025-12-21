using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

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
        var query = _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.Structure)
            .Include(s => s.SongChords)
            .ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns)
            .ThenInclude(sp => sp.StrummingPattern)
            .AsQueryable();

        var filters = request.Filters;

        var user = await _unitOfWork.Users.GetByIdAsync(request.Filters.UserId);

        if (user!.Role != Constants.Roles.Admin)
        {
            query = query.Where(q => (q.OwnerId != user.Id) ? (q.IsPublic == true) : true);
        }

        if (filters.IsPublic.HasValue)
        {
            query = query.Where(s => s.IsPublic == filters.IsPublic.Value);
        }

        if (!string.IsNullOrWhiteSpace(filters.SearchTerm))
        {
            var searchTerm = filters.SearchTerm.ToLower();
            query = query.Where(s =>
                s.FullText.ToLower().Contains(searchTerm) ||
                s.Title.ToLower().Contains(searchTerm) ||
                s.Artist != null && s.Artist.ToLower().Contains(searchTerm) ||
                s.Description != null && s.Description.ToLower().Contains(searchTerm));
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

        if (filters.ParentSongId.HasValue)
        {
            query = query.Where(s => s.ParentSongId == filters.ParentSongId.Value);
        }

        if (filters.MinRating.HasValue)
        {
            query = query.Where(s => s.AverageBeautifulRating >= filters.MinRating.Value);
        }

        if (filters.MaxRating.HasValue)
        {
            query = query.Where(s => s.AverageBeautifulRating <= filters.MaxRating.Value);
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

        var revies = _unitOfWork.SongReviews.GetQueryable().AsQueryable();

        for (int i = 0; i < songDtos.Count; i++)
        {
            var songReviews = revies.Where(r => r.SongId == songDtos[i].Id);

            if (songReviews == null || songReviews.Count() == 0)
            {
                continue;
            }

            songDtos[i].ReviewCount = songReviews.Count();

            songDtos[i].AverageBeautifulRating = songReviews.Average(r => r.BeautifulLevel);
            songDtos[i].AverageDifficultyRating = songReviews.Average(r => r.DifficultyLevel);
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

            "artist" => isAscending
                ? query.OrderBy(s => s.Artist)
                : query.OrderByDescending(s => s.Artist),

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
                ? query.OrderBy(s => s.AverageBeautifulRating ?? 0)
                : query.OrderByDescending(s => s.AverageBeautifulRating ?? 0),

            "difficulty" => isAscending
                ? query.OrderBy(s => s.AverageDifficultyRating ?? 0)
                : query.OrderByDescending(s => s.AverageDifficultyRating ?? 0),

            _ => query.OrderByDescending(s => s.CreatedAt)
        };
    }
}