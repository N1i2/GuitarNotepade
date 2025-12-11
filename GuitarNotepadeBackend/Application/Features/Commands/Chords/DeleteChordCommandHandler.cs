using Domain.Interfaces;
using Domain.Common;
using MediatR;

namespace Application.Features.Commands.Chords;

public class DeleteChordCommandHandler : IRequestHandler<DeleteChordCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteChordCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeleteChordCommand request, CancellationToken cancellationToken)
    {
        var chord = await _unitOfWork.Chords.GetByIdAsync(request.ChordId, cancellationToken);

        if (chord == null)
        {
            throw new KeyNotFoundException($"Chord with ID {request.ChordId} not found");
        }

        bool isCreator = chord.IsCreatedBy(request.UserId);
        bool isAdmin = request.UserRole == Constants.Roles.Admin;

        if (!isCreator && !isAdmin)
        {
            throw new UnauthorizedAccessException("You can only delete chords created by you or you must be an admin");
        }

        await _unitOfWork.Chords.DeleteByIdAsync(request.ChordId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}