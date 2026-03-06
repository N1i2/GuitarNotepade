using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongCommentsQueryHandler : IRequestHandler<GetSongCommentsQuery, List<SongCommentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSongCommentsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<SongCommentDto>> Handle(GetSongCommentsQuery request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException($"Song with id {request.SongId} not found");            
        }

        if (!song.IsPublic && request.UserId != song.OwnerId)
        {
            if (request.UserId.HasValue)
            {
                var user = await _unitOfWork.Users.GetByIdAsync(request.UserId.Value, cancellationToken);
                if (user?.Role != Constants.Roles.Admin)
                    throw new UnauthorizedAccessException("You don't have access to this song");
            }
            else
            {
                throw new UnauthorizedAccessException("Song is private");
            }
        }

        var comments = await _unitOfWork.SongComments.GetBySongIdAsync(
            request.SongId,
            request.Page,
            request.PageSize,
            cancellationToken);

        return _mapper.Map<List<SongCommentDto>>(comments);
    }
}