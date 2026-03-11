using Application.DTOs;
using Application.DTOs.Chords;
using Application.DTOs.Generic;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Chords;

public class SearchChordsByNameQueryHandler : IRequestHandler<SearchChordsByNameQuery, PaginatedDto<ChordDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public SearchChordsByNameQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedDto<ChordDto>> Handle(SearchChordsByNameQuery request, CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Chords.GetQueryable()
            .Include(c => c.CreatedBy)
            .Where(c => c.Name.Contains(request.Name))
            .OrderBy(c => c.Name);

        var totalCount = await query.CountAsync(cancellationToken);

        var chords = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
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

        return PaginatedDto<ChordDto>.Create(
            chordDtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}
