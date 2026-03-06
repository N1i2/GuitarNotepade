using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.StrummingPatterns;

public class AddPatternToSongCommandHandler : IRequestHandler<AddPatternToSongCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AddPatternToSongCommandHandler> _logger;

    public AddPatternToSongCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<AddPatternToSongCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<bool> Handle(AddPatternToSongCommand request, CancellationToken cancellationToken)
    {
        return await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
            if (song == null)
            {
                throw new ArgumentException("Song not found", nameof(request.SongId));
            }

            if (song.OwnerId != request.UserId)
            {
                throw new UnauthorizedAccessException("You don't have permission to modify this song");
            }

            var pattern = await _unitOfWork.StrummingPatterns.GetByIdAsync(request.PatternId, cancellationToken);
            if (pattern == null)
            {
                throw new ArgumentException("Pattern not found", nameof(request.PatternId));
            }

            if (song.SongPatterns.Any(sp => sp.StrummingPatternId == request.PatternId))
            {
                _logger.LogDebug("Pattern {PatternId} already exists in song {SongId}",
                    request.PatternId, request.SongId);
                return true;
            }

            var songPattern = SongPattern.Create(request.SongId, request.PatternId);

            await _unitOfWork.SongPatterns.CreateAsync(songPattern, cancellationToken);

            _logger.LogInformation("Pattern {PatternId} added to song {SongId}",
                request.PatternId, request.SongId);

            return true;

        }, cancellationToken);
    }
}
