using Domain.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class DeleteSongCommandHandler : IRequestHandler<DeleteSongCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteSongCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeleteSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException($"Song with ID {request.SongId} not found");
        }

        bool isOwner = song.OwnerId == request.UserId;
        bool isAdmin = request.UserRole == Constants.Roles.Admin;

        if (!isOwner && !isAdmin)
        {
            throw new UnauthorizedAccessException("You can only delete your own songs or you must be an admin");
        }
        
        var childSongs = await _unitOfWork.Songs.GetByParentIdAsync(request.SongId, cancellationToken);
        foreach (var childSong in childSongs)
        {
            childSong.SetParents();
            await _unitOfWork.Songs.UpdateAsync(childSong, cancellationToken);
        }

        var reviews = await _unitOfWork.SongReviews.GetBySongIdAsync(request.SongId, cancellationToken);
        foreach (var review in reviews)
        {
            var reviewLikes = await _unitOfWork.ReviewLikes.GetByReviewIdAsync(review.Id, cancellationToken);
            foreach (var like in reviewLikes)
            {
                await _unitOfWork.ReviewLikes.DeleteAsync(like.Id, cancellationToken);
            }
            await _unitOfWork.SongReviews.DeleteAsync(review.Id, cancellationToken);
        }

        var songChords = await _unitOfWork.Songs.GetQueryable()
            .Where(s => s.Id == request.SongId)
            .SelectMany(s => s.SongChords)
            .ToListAsync(cancellationToken);

        var songPatterns = await _unitOfWork.Songs.GetQueryable()
            .Where(s => s.Id == request.SongId)
            .SelectMany(s => s.SongPatterns)
            .ToListAsync(cancellationToken);

        await _unitOfWork.Songs.DeleteAsync(request.SongId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}