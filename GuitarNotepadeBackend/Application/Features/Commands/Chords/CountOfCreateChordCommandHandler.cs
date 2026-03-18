using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Domain.Common;

namespace Application.Features.Commands.Chords;

public class CountOfCreateChordCommandHandler : IRequestHandler<CountOfCreateChordCommand, int>
{
    public readonly IUnitOfWork _unitOfWork;
    public readonly IUserService _userService;

    public CountOfCreateChordCommandHandler(IUnitOfWork unitOfWork, IUserService userService)
    {
        _unitOfWork = unitOfWork;
        _userService = userService;
    }

    public async Task<int> Handle(CountOfCreateChordCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.userId, cancellationToken);

        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(request.userId));
        }

        if (user.IsGuest)
        {
            return 0;
        }
        if (user.HasPremium || user.IsAdmin)
        {
            return -1;
        }

        var count = await _userService.GetUserChordsCountAsync(request.userId, cancellationToken);

        return Constants.Limits.FreeUserMaxChords - count;
    }
}
