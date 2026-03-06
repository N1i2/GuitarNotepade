using Application.DTOs.StrummingPatterns;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.StrummingPatterns;

public class CreatePatternCommandHandler : IRequestHandler<CreatePatternCommand, StrummingPatternsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreatePatternCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StrummingPatternsDto> Handle(CreatePatternCommand request, CancellationToken cancellationToken)
    {
        var exists = await _unitOfWork.StrummingPatterns.ExistsWithSameNameAsync(
            request.Name, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Pattern '{request.Name}' already exists");
        }

        var sp = StrummingPattern.Create(
            request.Name,
            request.Pattern,
            request.IsFingerStyle,
            request.UserId,
            request.Description);

        await _unitOfWork.StrummingPatterns.CreateAsync(sp, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var patternWithUser = await _unitOfWork.StrummingPatterns
            .GetQueryable()
            .Include(p => p.CreatedBy)
            .FirstOrDefaultAsync(p => p.Id == sp.Id, cancellationToken);

        if (patternWithUser == null)
            throw new Exception("Failed to load created pattern");

        return MapToDto(patternWithUser);
    }

    private StrummingPatternsDto MapToDto(StrummingPattern sp)
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