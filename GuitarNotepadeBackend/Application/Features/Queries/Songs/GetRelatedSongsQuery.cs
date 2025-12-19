using Application.DTOs.Generic;
using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public record GetRelatedSongsQuery(
    Guid SongId,
    int Limit = 10) : IRequest<List<SongDto>>;