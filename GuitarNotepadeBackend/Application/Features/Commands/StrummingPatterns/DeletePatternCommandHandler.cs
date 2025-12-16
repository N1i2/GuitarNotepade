using Domain.Interfaces;
using Domain.Common;
using MediatR;

namespace Application.Features.Commands.Chords;

public class DeletePatternCommandHandler : IRequestHandler<DeletePatternCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeletePatternCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeletePatternCommand request, CancellationToken cancellationToken)
    {
        var sp = await _unitOfWork.StrummingPatterns.GetByIdAsync(request.PatternId, cancellationToken);

        if (sp == null)
        {
            throw new KeyNotFoundException($"Pattern with ID {request.PatternId} not found");
        }

        bool isCreator = sp.IsCreatedBy(request.UserId);
        bool isAdmin = request.UserRole == Constants.Roles.Admin;

        if (!isCreator && !isAdmin)
        {
            throw new UnauthorizedAccessException("You can only delete pattern created by you or you must be an admin");
        }

        await _unitOfWork.StrummingPatterns.DeleteByIdAsync(request.PatternId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}