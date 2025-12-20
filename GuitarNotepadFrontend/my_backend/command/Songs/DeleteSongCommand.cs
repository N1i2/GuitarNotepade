using MediatR;

namespace Application.Features.Commands.Songs;

public record DeleteSongCommand(
    Guid UserId,
    Guid SongId) : IRequest<bool>;