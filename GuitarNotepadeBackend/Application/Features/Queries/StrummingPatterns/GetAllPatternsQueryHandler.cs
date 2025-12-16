using Application.DTOs.Chords;
using Application.DTOs.Generic;
using Application.DTOs.StrummingPatterns;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Xml.Linq;

namespace Application.Features.Queries.StrummingPatterns;

public class GetAllPatternsQueryHandler : IRequestHandler<GetAllPatternsQuery, PaginatedDto<StrummingPatternsDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllPatternsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedDto<StrummingPatternsDto>> Handle(GetAllPatternsQuery request, CancellationToken cancellationToken)
    {
        var baseQuery = _unitOfWork.StrummingPatterns.GetQueryable()
            .Include(c => c.CreatedBy);

        var filteredQuery = baseQuery.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Filters.Name))
        {
            filteredQuery = filteredQuery.Where(c => c.Name.Contains(request.Filters.Name));
        }

        if (request.Filters.MyPatternsOnly.HasValue && request.Filters.MyPatternsOnly.Value && request.Filters.UserId.HasValue)
        {
            filteredQuery = filteredQuery.Where(c => c.CreatedByUserId == request.Filters.UserId.Value);
        }

        if(request.Filters.IsFingerStyle.HasValue)
        {
            filteredQuery = filteredQuery.Where(c => c.IsFingerStyle == request.Filters.IsFingerStyle.Value);
        }

        var sortedQuery = ApplySorting(filteredQuery, request.Filters.SortBy, request.Filters.SortOrder);

        var totalCount = await sortedQuery.CountAsync(cancellationToken);

        var chords = await sortedQuery
            .Skip((request.Filters.Page - 1) * request.Filters.PageSize)
            .Take(request.Filters.PageSize)
            .ToListAsync(cancellationToken);

        var chordDtos = chords.Select(sp => new StrummingPatternsDto
        {
            Id = sp.Id,
            Name = sp.Name,
            Pattern = sp.Pattern,
            Description = sp.Description,
            IsFingerStyle = sp.IsFingerStyle,
            CreatedByUserId = sp.CreatedByUserId,
            CreatedByNikName = sp.CreatedBy?.NikName,
            CreatedAt = sp.CreatedAt,
            UpdatedAt = sp.UpdatedAt
        }).ToList();

        return PaginatedDto<StrummingPatternsDto>.Create(
            chordDtos,
            totalCount,
            request.Filters.Page,
            request.Filters.PageSize);
    }

    private IQueryable<Domain.Entities.StrummingPattern> ApplySorting(
       IQueryable<Domain.Entities.StrummingPattern> query,
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
