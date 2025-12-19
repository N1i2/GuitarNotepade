using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public record CreateSongWithSegmentsCommand(
    Guid UserId,
    CreateSongWithSegmentsDto Dto) : IRequest<SongDto>;

