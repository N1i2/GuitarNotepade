using Application.DTOs;
using Application.DTOs.Chords;
using Domain.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Chords;

public class GetAllChordsQueryHandler : IRequestHandler<GetAllChordsQuery, PaginatedChordsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllChordsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedChordsDto> Handle(GetAllChordsQuery request, CancellationToken cancellationToken)
    {
        var baseQuery = _unitOfWork.Chords.GetQueryable()
            .Include(c => c.CreatedBy);

        var filteredQuery = baseQuery.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Filters.Name))
        {
            filteredQuery = filteredQuery.Where(c => c.Name.Contains(request.Filters.Name));
        }

        if (request.Filters.MyChordsOnly.HasValue && request.Filters.MyChordsOnly.Value && request.Filters.UserId.HasValue)
        {
            filteredQuery = filteredQuery.Where(c => c.CreatedByUserId == request.Filters.UserId.Value);
        }

        var sortedQuery = ApplySorting(filteredQuery, request.Filters.SortBy, request.Filters.SortOrder);

        var totalCount = await sortedQuery.CountAsync(cancellationToken);

        var chords = await sortedQuery
            .Skip((request.Filters.Page - 1) * request.Filters.PageSize)
            .Take(request.Filters.PageSize)
            .ToListAsync(cancellationToken);

        var chordDtos = chords.Select(chord => new ChordDto
        {
            Id = chord.Id,
            Name = chord.Name,
            Fingering = chord.Fingering,
            Description = chord.Description,
            CreatedByUserId = chord.CreatedByUserId,
            CreatedByNikName = chord.CreatedBy?.NikName,
            CreatedAt = chord.CreatedAt,
            UpdatedAt = chord.UpdatedAt
        }).ToList();

        return PaginatedChordsDto.Create(
            chordDtos,
            totalCount,
            request.Filters.Page,
            request.Filters.PageSize);
    }

    private IQueryable<Domain.Entities.Chord> ApplySorting(
        IQueryable<Domain.Entities.Chord> query,
        string sortBy,
        string sortOrder)
    {
        var isAscending = sortOrder.ToLower() == "asc";

        return sortBy.ToLower() switch
        {
            "name" => isAscending
                ? query.OrderBy(c => c.Name)
                : query.OrderByDescending(c => c.Name),

            "createdat" => isAscending
                ? query.OrderBy(c => c.CreatedAt)
                : query.OrderByDescending(c => c.CreatedAt),

            "updatedat" => isAscending
                ? query.OrderBy(c => c.UpdatedAt ?? c.CreatedAt) 
                : query.OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt),

            _ => query.OrderBy(c => c.Name)
        };
    }
}