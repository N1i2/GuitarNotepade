using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetRelatedSongsQueryHandler : IRequestHandler<GetRelatedSongsQuery, List<SongDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetRelatedSongsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<SongDto>> Handle(GetRelatedSongsQuery request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(request.SongId));

        var relatedSongs = new List<Domain.Entities.Song>();

        if (song.SongChords.Any())
        {
            var chordIds = song.SongChords.Select(sc => sc.ChordId).ToList();
            var songsByChords = await _unitOfWork.Songs.GetQueryable()
                .Where(s => s.IsPublic && s.Id != request.SongId && 
                           s.SongChords.Any(sc => chordIds.Contains(sc.ChordId)))
                .Include(s => s.Owner)
                .Include(s => s.SongChords)
                    .ThenInclude(sc => sc.Chord)
                .OrderByDescending(s => s.CreatedAt)
                .Take(request.Limit)
                .ToListAsync(cancellationToken);

            relatedSongs.AddRange(songsByChords);
        }

        if (song.SongPatterns.Any())
        {
            var patternIds = song.SongPatterns.Select(sp => sp.StrummingPatternId).ToList();
            var songsByPatterns = await _unitOfWork.Songs.GetQueryable()
                .Where(s => s.IsPublic && s.Id != request.SongId && 
                           s.SongPatterns.Any(sp => patternIds.Contains(sp.StrummingPatternId)) &&
                           !relatedSongs.Any(rs => rs.Id == s.Id))
                .Include(s => s.Owner)
                .Include(s => s.SongPatterns)
                    .ThenInclude(sp => sp.StrummingPattern)
                .OrderByDescending(s => s.CreatedAt)
                .Take(request.Limit - relatedSongs.Count)
                .ToListAsync(cancellationToken);

            relatedSongs.AddRange(songsByPatterns);
        }

        if (song.ParentSongId.HasValue)
        {
            var copies = await _unitOfWork.Songs.GetByParentIdAsync(song.ParentSongId.Value, cancellationToken);
            var publicCopies = copies
                .Where(s => s.IsPublic && s.Id != request.SongId && 
                           !relatedSongs.Any(rs => rs.Id == s.Id))
                .Take(request.Limit - relatedSongs.Count)
                .ToList();
            
            relatedSongs.AddRange(publicCopies);
        }

        var childSongs = await _unitOfWork.Songs.GetByParentIdAsync(request.SongId, cancellationToken);
        var publicChildren = childSongs
            .Where(s => s.IsPublic && !relatedSongs.Any(rs => rs.Id == s.Id))
            .Take(request.Limit - relatedSongs.Count)
            .ToList();
        
        relatedSongs.AddRange(publicChildren);

        return _mapper.Map<List<SongDto>>(relatedSongs.Take(request.Limit));
    }
}

