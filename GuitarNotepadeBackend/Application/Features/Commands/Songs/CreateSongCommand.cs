using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public record CreateSongCommand(
    Guid UserId,
    string Title,
    string Gener,
    string Theme,
    string? Artist,
    string? Description,
    bool IsPublic,
    Guid? ParentSongId) : IRequest<SongDto>;