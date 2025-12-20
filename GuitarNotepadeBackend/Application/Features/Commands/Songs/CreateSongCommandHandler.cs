using Application.DTOs.Song;
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
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
            throw new ArgumentException("User not found", nameof(request.UserId));

        if (request.ParentSongId.HasValue)
        {
            var parentSong = await _unitOfWork.Songs.GetByIdAsync(request.ParentSongId.Value, cancellationToken);
            if (parentSong == null || !parentSong.IsPublic)
                throw new ArgumentException("Parent song not found or not public", nameof(request.ParentSongId));
        }

        var song = Domain.Entities.Song.Create(
            request.UserId,
            request.Title,
            request.IsPublic,
            request.Gener,
            request.Theme,
            request.Artist,
            request.Description,
            request.ParentSongId);

        await _unitOfWork.Songs.CreateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var fullSong = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.ParentSong)
            .Include(s => s.Structure)
            .Include(s => s.SongChords)
                .ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns)
                .ThenInclude(sp => sp.StrummingPattern)
            .FirstOrDefaultAsync(s => s.Id == song.Id, cancellationToken);

        return _mapper.Map<SongDto>(fullSong);
    }
}