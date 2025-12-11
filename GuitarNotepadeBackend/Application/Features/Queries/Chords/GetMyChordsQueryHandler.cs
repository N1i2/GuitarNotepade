using Application.DTOs;
using Application.DTOs.Chords;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Chords;

public class GetMyChordsQueryHandler : IRequestHandler<GetMyChordsQuery, PaginatedChordsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetMyChordsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedChordsDto> Handle(GetMyChordsQuery request, CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Chords.GetQueryable()
            .Include(c => c.CreatedBy)
            .Where(c => c.CreatedByUserId == request.UserId)
            .OrderByDescending(c => c.CreatedAt);

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

        return PaginatedChordsDto.Create(
            chordDtos,
            totalCount,
            request.Page,
            request.PageSize);
    }
}