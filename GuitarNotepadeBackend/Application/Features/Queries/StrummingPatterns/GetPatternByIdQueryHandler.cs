using Application.DTOs.StrummingPatterns;
using Application.Features.Queries.Chords;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.sps;

public class GetPatternByIdQueryHandler : IRequestHandler<GetPatternByIdQuery, StrummingPatternsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPatternByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StrummingPatternsDto> Handle(GetPatternByIdQuery request, CancellationToken cancellationToken)
    {
        var sp = await _unitOfWork.StrummingPatterns.GetQueryable()
            .Include(c => c.CreatedBy)
            .FirstOrDefaultAsync(c => c.Id == request.PatternId, cancellationToken);

        if (sp == null)
        {
            throw new KeyNotFoundException($"Pattern with ID {request.PatternId} not found");
        }

        return new StrummingPatternsDto
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
        };
    }
}
