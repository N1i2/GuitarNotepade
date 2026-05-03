using Application.DTOs.Alboms;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Alboms;

public class SearchAlbumsQueryHandler : IRequestHandler<SearchAlbumsQuery, AlbumSearchResultDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IWebDavService _webDavService;

    public SearchAlbumsQueryHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _webDavService = webDavService;
    }

    public async Task<AlbumSearchResultDto> Handle(
        SearchAlbumsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Alboms.GetQueryable()
            .Include(a => a.Owner)
            .Include(a => a.SongAlbums)
            .AsQueryable();

        var filters = request.Filters;

        if (filters.UserId != Guid.Empty)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(filters.UserId, cancellationToken);
            if (user == null)
            {
                query = query.Where(q => q.IsPublic);
            }
            else if (user.Role != Constants.Roles.Admin)
            {
                query = query.Where(q => q.OwnerId == user.Id || q.IsPublic);
            }
        }
        else
        {
            query = query.Where(q => q.IsPublic);
        }

        if (filters.IsPublic.HasValue)
        {
            query = query.Where(a => a.IsPublic == filters.IsPublic.Value);
        }

        if (!string.IsNullOrWhiteSpace(filters.SearchTerm))
        {
            var searchTerm = filters.SearchTerm.ToLower();
            query = query.Where(a =>
                a.Title.ToLower().Contains(searchTerm) ||
                a.Description != null && a.Description.ToLower().Contains(searchTerm) ||
                (a.Genre ?? "").ToLower().Contains(searchTerm) ||
                (a.Theme ?? "").ToLower().Contains(searchTerm));
        }

        if (filters.OwnerId.HasValue)
        {
            query = query.Where(a => a.OwnerId == filters.OwnerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filters.Genre))
        {
            query = query.Where(a => (a.Genre ?? "").ToLower().Contains(filters.Genre.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(filters.Theme))
        {
            query = query.Where(a => (a.Theme ?? "").ToLower().Contains(filters.Theme.ToLower()));
        }

        query = ApplySorting(query, filters.SortBy, filters.SortOrder);

        var totalCount = await query.CountAsync(cancellationToken);

        var albums = await query
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .ToListAsync(cancellationToken);

        var albumIds = albums.Select(a => a.Id).ToList();

        var subscriptionsCount = new Dictionary<Guid, int>();

        if (albumIds.Any())
        {
            var subscriptionsData = await _unitOfWork.Subscriptions
                .GetQueryable()
                .Where(s => s.TargetAlbumId.HasValue)
                .GroupBy(s => s.TargetAlbumId!.Value)
                .Where(g => albumIds.Contains(g.Key))
                .Select(g => new { AlbumId = g.Key, Count = g.Count() })
                .ToListAsync(cancellationToken);

            subscriptionsCount = subscriptionsData.ToDictionary(x => x.AlbumId, x => x.Count);
        }

        var albumDtos = new List<AlbumDto>();

        foreach (var album in albums)
        {
            var dto = _mapper.Map<AlbumDto>(album);
            dto.OwnerName = album.Owner.NikName;
            dto.CountOfSongs = album.SongAlbums.Count;
            dto.SubscribersCount = subscriptionsCount.GetValueOrDefault(album.Id, 0);

            if (!string.IsNullOrEmpty(album.CoverUrl))
            {
                dto.CoverUrl = await _webDavService.GetAlbumCoverUrlAsync(album.CoverUrl);
            }

            albumDtos.Add(dto);
        }

        return new AlbumSearchResultDto
        {
            Albums = albumDtos,
            TotalCount = totalCount,
            Page = filters.Page,
            PageSize = filters.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filters.PageSize)
        };
    }

    private IQueryable<Domain.Entities.Album> ApplySorting(
        IQueryable<Domain.Entities.Album> query,
        string sortBy,
        string sortOrder)
    {
        var isAscending = sortOrder.ToLower() == "asc";

        return sortBy.ToLower() switch
        {
            "title" => isAscending
                ? query.OrderBy(a => a.Title)
                : query.OrderByDescending(a => a.Title),

            "createdat" => isAscending
                ? query.OrderBy(a => a.CreatedAt)
                : query.OrderByDescending(a => a.CreatedAt),

            "updatedat" => isAscending
                ? query.OrderBy(a => a.UpdatedAt ?? a.CreatedAt)
                : query.OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt),

            "songscount" => isAscending
                ? query.OrderBy(a => a.SongAlbums.Count)
                : query.OrderByDescending(a => a.SongAlbums.Count),

            "genre" => isAscending
                ? query.OrderBy(a => a.Genre)
                : query.OrderByDescending(a => a.Genre),

            "theme" => isAscending
                ? query.OrderBy(a => a.Theme)
                : query.OrderByDescending(a => a.Theme),

            _ => query.OrderByDescending(a => a.CreatedAt)
        };
    }
}
