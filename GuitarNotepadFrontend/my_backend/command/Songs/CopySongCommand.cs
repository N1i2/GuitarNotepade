using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public record CopySongCommand(
    Guid UserId,
    Guid OriginalSongId) : IRequest<SongDto>;