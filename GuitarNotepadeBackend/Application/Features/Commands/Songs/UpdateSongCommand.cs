using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public record UpdateSongCommand(
    Guid UserId,
    Guid SongId,
    string? Title,
    string? Artist,
    string? Genre,
    string? Theme,
    string? Description,
    string? AudioBase64,
    string? AudioType,
    bool? IsPublic) : IRequest<SongDto>;