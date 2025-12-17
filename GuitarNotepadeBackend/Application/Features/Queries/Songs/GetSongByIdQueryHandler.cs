using Application.DTOs.Songs;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSongByIdQueryHandler : IRequestHandler<GetSongByIdQuery, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSongByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongDto> Handle(GetSongByIdQuery request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.SongChords).ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns).ThenInclude(sp => sp.StrummingPattern)
            .Include(s => s.Reviews).ThenInclude(r => r.User)
            .Include(s => s.ChildSongs)
            .FirstOrDefaultAsync(s => s.Id == request.SongId, cancellationToken);

        if (song == null)
        {
            throw new KeyNotFoundException($"Song with ID {request.SongId} not found");
        }

        if (!song.IsPublic && song.OwnerId != request.UserId)
        {
            throw new UnauthorizedAccessException("You don't have permission to view this song");
        }

        var songDto = _mapper.Map<SongDto>(song);

        if (songDto.Structure?.Metadata?.Comments != null &&
            song.GetStructure().Metadata?.Comments != null)
        {
            var comments = song.GetStructure().Metadata.Comments;
            var users = await _unitOfWork.Users.GetQueryable()
                .Where(u => comments.Select(c => c.AuthorId).Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.NikName, cancellationToken);

            foreach (var commentDto in songDto.Structure.Metadata.Comments)
            {
                if (users.TryGetValue(commentDto.AuthorId, out var nikName))
                {
                    commentDto.AuthorName = nikName;
                }
                else
                {
                    commentDto.AuthorName = "Unknown";
                }
            }
        }

        return songDto;
    }
}