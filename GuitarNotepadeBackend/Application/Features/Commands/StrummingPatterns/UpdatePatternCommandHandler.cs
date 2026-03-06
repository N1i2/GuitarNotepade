using Application.DTOs.StrummingPatterns;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.StrummingPatterns;

public class UpdatePatternCommandHandler : IRequestHandler<UpdatePatternCommand, StrummingPatternsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePatternCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StrummingPatternsDto> Handle(UpdatePatternCommand request, CancellationToken cancellationToken)
    {
        var sp = await _unitOfWork.StrummingPatterns
            .GetQueryable()
            .Include(p => p.CreatedBy)
            .FirstOrDefaultAsync(p => p.Id == request.PatternId, cancellationToken);

        if (sp == null)
        {
            throw new KeyNotFoundException($"Pattern with ID {request.PatternId} not found");
        }

        if (!sp.IsCreatedBy(request.UserId))
        {
            throw new UnauthorizedAccessException("You can only update pattern created by you");
        }

        if (!string.IsNullOrEmpty(request.Name) && request.Name != sp.Name)
        {
            var exists = await _unitOfWork.StrummingPatterns.ExistsWithSameNameAsync(
                request.Name, cancellationToken);

            if (exists)
            {
                throw new InvalidOperationException($"Pattern with name '{request.Name}' already exists");
            }
        }

        sp.Update(request.Name, request.Pattern, request.IsFingerStyle, request.Description);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(sp);
    }

    private StrummingPatternsDto MapToDto(Domain.Entities.StrummingPattern sp)
    {
        return new StrummingPatternsDto
        {
            Id = sp.Id,
            Name = sp.Name,
            Pattern = sp.Pattern,
            IsFingerStyle = sp.IsFingerStyle,
            Description = sp.Description,
            CreatedByUserId = sp.CreatedByUserId,
            CreatedByNikName = sp.CreatedBy?.NikName,
            CreatedAt = sp.CreatedAt,
            UpdatedAt = sp.UpdatedAt
        };
    }
}