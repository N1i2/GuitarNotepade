using MediatR;

namespace Application.Features.Commands.Chords;

public record RemoveChordFromSongCommand(
    Guid UserId,
    Guid SongId,
    Guid ChordId) : IRequest<bool>;