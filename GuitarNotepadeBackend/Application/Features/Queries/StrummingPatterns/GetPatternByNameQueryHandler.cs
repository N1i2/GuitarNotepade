using Application.DTOs.StrummingPatterns;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.StrummingPatterns;

public class GetPatternByNameQueryHandler : IRequestHandler<GetPatternByNameQuery, StrummingPatternsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPatternByNameQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StrummingPatternsDto> Handle(GetPatternByNameQuery request, CancellationToken cancellationToken)
    {
        var sp = await _unitOfWork.StrummingPatterns.GetQueryable()
            .Include(c => c.CreatedBy)
            .FirstOrDefaultAsync(sp => sp.Name == request.PatternName, cancellationToken);

        if (sp == null)
        {
            throw new KeyNotFoundException($"Pattern with name {request.PatternName} not found");
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
