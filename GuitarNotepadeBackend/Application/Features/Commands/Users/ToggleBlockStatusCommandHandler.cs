using Application.DTOs.Users;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands.Users;

public class ToggleBlockStatusCommandHandler : IRequestHandler<ToggleBlockStatusCommand, BlockUserResponseDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public ToggleBlockStatusCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<BlockUserResponseDto> Handle(ToggleBlockStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException($"User with email '{request.Email}' not found");
        }

        if (user.Id == request.AdminId)
        {
            throw new InvalidOperationException("Admin cannot block/unblock themselves");
        }

        user.CheckAndClearExpiredBlock();

        if (request.IsBlockAction)
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                throw new ArgumentException("Block reason is required");
            }

            if (request.BlockedUntil == null)
            {
                throw new ArgumentException("Block duration is required");
            }

            if (request.BlockedUntil.Value <= DateTime.UtcNow)
            {
                throw new ArgumentException("Block until date must be in the future");
            }

            if (request.BlockedUntil.Value > DateTime.UtcNow.AddYears(100))
            {
                throw new ArgumentException("Block duration cannot exceed 100 years");
            }

            user.Block(request.BlockedUntil.Value, request.Reason);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new BlockUserResponseDto
            (
                user.Id,
                true,
                user.BlockedUntil,
                user.BlockReason,
                $"User '{user.Email}' has been blocked until {user.BlockedUntil:yyyy-MM-dd HH:mm} UTC. Reason: {user.BlockReason}"
            );
        }
        else
        {
            var wasBlocked = user.BlockedUntil.HasValue;
            user.Unblock();

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new BlockUserResponseDto
            (
                UserId: user.Id,
                WasBlocked: false,
                BlockedUntil: null,
                BlockReason: null,
                Message: wasBlocked
                    ? $"User '{user.Email}' has been unblocked"
                    : $"User '{user.Email}' was not blocked"
            );
        }
    }
}