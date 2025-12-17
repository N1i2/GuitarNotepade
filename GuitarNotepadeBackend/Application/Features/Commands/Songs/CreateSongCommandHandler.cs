using Application.DTOs.Songs;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class CreateSongCommandHandler : IRequestHandler<CreateSongCommand, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateSongCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongDto> Handle(CreateSongCommand request, CancellationToken cancellationToken)
    {
        var owner = await _unitOfWork.Users.GetByIdAsync(request.OwnerId, cancellationToken);
        if (owner == null)
        {
            throw new KeyNotFoundException($"User with ID {request.OwnerId} not found");
        }

        if (owner.IsBlocked)
        {
            throw new InvalidOperationException("User is blocked and cannot create songs");
        }

        var existingSong = await _unitOfWork.Songs.GetByTitleAndOwnerAsync(
            request.Title, request.OwnerId, cancellationToken);
        if (existingSong != null)
        {
            throw new InvalidOperationException($"You already have a song with title '{request.Title}'");
        }

        if (request.ParentSongId.HasValue)
        {
            var parentSong = await _unitOfWork.Songs.GetByIdAsync(request.ParentSongId.Value, cancellationToken);
            if (parentSong == null)
            {
                throw new KeyNotFoundException($"Parent song with ID {request.ParentSongId} not found");
            }
            if (!parentSong.IsPublic && parentSong.OwnerId != request.OwnerId)
            {
                throw new UnauthorizedAccessException("You cannot fork a private song");
            }
        }

        if (request.ChordIds != null && request.ChordIds.Any())
        {
            foreach (var chordId in request.ChordIds)
            {
                if (!await _unitOfWork.Chords.ExistsAsync(chordId, cancellationToken))
                {
                    throw new KeyNotFoundException($"Chord with ID {chordId} not found");
                }
            }
        }

        if (request.PatternIds != null && request.PatternIds.Any())
        {
            foreach (var patternId in request.PatternIds)
            {
                if (!await _unitOfWork.StrummingPatterns.ExistsAsync(patternId, cancellationToken))
                {
                    throw new KeyNotFoundException($"Pattern with ID {patternId} not found");
                }
            }
        }

        var song = Domain.Entities.Song.Create(
            request.OwnerId,
            request.Title,
            request.IsPublic,
            request.Structure,
            request.Artist);

        song.SetParents(request.ParentSongId);

        await _unitOfWork.Songs.CreateAsync(song, cancellationToken);

        if (request.ChordIds != null)
        {
            foreach (var chordId in request.ChordIds)
            {
                song.AddChord(chordId);
            }
        }

        if (request.PatternIds != null)
        {
            foreach (var patternId in request.PatternIds)
            {
                song.AddPattern(patternId);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var songWithRelations = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.SongChords)
            .Include(s => s.SongPatterns)
            .Include(s => s.Reviews)
            .FirstOrDefaultAsync(s => s.Id == song.Id, cancellationToken);

        if (songWithRelations == null)
        {
            throw new InvalidOperationException("Failed to create song");
        }

        return _mapper.Map<SongDto>(songWithRelations);
    }
}