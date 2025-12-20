using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public record ToggleSongVisibilityCommand(
    Guid UserId,
    Guid SongId,
    bool IsPublic) : IRequest<SongDto>;