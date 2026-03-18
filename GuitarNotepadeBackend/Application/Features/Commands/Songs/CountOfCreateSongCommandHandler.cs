using Domain.Interfaces;
using Domain.Common;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.Songs;

public class CountOfCreateSongCommandHandler : IRequestHandler<CountOfCreateSongCommand, int>
{
    public readonly IUnitOfWork _unitOfWork;
    public readonly IUserService _userService;

    public CountOfCreateSongCommandHandler(IUnitOfWork unitOfWork, IUserService userService)
    {
        _unitOfWork = unitOfWork;
        _userService = userService;
    }

    public async Task<int> Handle(CountOfCreateSongCommand request, CancellationToken cancellationToken)
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

        var count = await _userService.GetUserSongsCountAsync(request.userId, cancellationToken);

        return Constants.Limits.FreeUserMaxSongs - count;
    }
}
