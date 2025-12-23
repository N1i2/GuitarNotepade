using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public record UpdateSongCommand(
    Guid UserId,
    UpdateSongWithSegmentsDto Dto) : IRequest<SongDto>;
