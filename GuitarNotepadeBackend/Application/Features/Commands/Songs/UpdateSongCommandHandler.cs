using Application.DTOs.Songs;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class UpdateSongCommandHandler : IRequestHandler<UpdateSongCommand, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UpdateSongCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongDto> Handle(UpdateSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.SongChords)
            .Include(s => s.SongPatterns)
            .FirstOrDefaultAsync(s => s.Id == request.SongId, cancellationToken);

        if (song == null)
        {
            throw new KeyNotFoundException($"Song with ID {request.SongId} not found");
        }

        if (song.OwnerId != request.UserId)
        {
            throw new UnauthorizedAccessException("You can only update your own songs");
        }

        if (!string.IsNullOrEmpty(request.Title) && request.Title != song.Title)
        {
            var existingSong = await _unitOfWork.Songs.GetByTitleAndOwnerAsync(
                request.Title, request.UserId, cancellationToken);
            if (existingSong != null && existingSong.Id != request.SongId)
            {
                throw new InvalidOperationException($"You already have a song with title '{request.Title}'");
            }
        }

        if (request.Title != null || request.Artist != null || request.IsPublic.HasValue)
        {
            song.Update(
                title: request.Title,
                artist: request.Artist,
                isPublic: request.IsPublic);
        }

        if (request.Structure != null)
        {
            song.SetStructure(request.Structure);
        }

        if (request.ChordIds != null)
        {
            var currentChordIds = song.GetChordIds();

            foreach (var chordId in currentChordIds)
            {
                if (!request.ChordIds.Contains(chordId))
                {
                    song.RemoveChord(chordId);
                }
            }

            foreach (var chordId in request.ChordIds)
            {
                if (!currentChordIds.Contains(chordId))
                {
                    var chordExists = await _unitOfWork.Chords.ExistsAsync(chordId, cancellationToken);
                    if (!chordExists)
                    {
                        throw new KeyNotFoundException($"Chord with ID {chordId} not found");
                    }
                    song.AddChord(chordId);
                }
            }
        }

        if (request.PatternIds != null)
        {
            var currentPatternIds = song.GetPatternIds();

            foreach (var patternId in currentPatternIds)
            {
                if (!request.PatternIds.Contains(patternId))
                {
                    song.RemovePattern(patternId);
                }
            }

            foreach (var patternId in request.PatternIds)
            {
                if (!currentPatternIds.Contains(patternId))
                {
                    var patternExists = await _unitOfWork.StrummingPatterns.ExistsAsync(patternId, cancellationToken);
                    if (!patternExists)
                    {
                        throw new KeyNotFoundException($"Pattern with ID {patternId} not found");
                    }
                    song.AddPattern(patternId);
                }
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedSong = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.SongChords)
            .Include(s => s.SongPatterns)
            .Include(s => s.Reviews)
            .FirstOrDefaultAsync(s => s.Id == request.SongId, cancellationToken);

        return _mapper.Map<SongDto>(updatedSong!);
    }
}