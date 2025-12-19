using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public record UpdateSongCommand(
    Guid UserId,
    Guid SongId,
    string? Title,
    string? Artist,
    string? Description,
    bool? IsPublic,
    string? Key,
    string? Difficulty) : IRequest<SongDto>;