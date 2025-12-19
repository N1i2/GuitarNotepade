using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class UpdateSongCommentCommandHandler : IRequestHandler<UpdateSongCommentCommand, SongCommentDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UpdateSongCommentCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongCommentDto> Handle(UpdateSongCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = await _unitOfWork.SongComments.GetQueryable()
            .Include(c => c.Song)
                .ThenInclude(s => s.Owner)
            .Include(c => c.Segment)
            .FirstOrDefaultAsync(c => c.Id == request.CommentId, cancellationToken);

        if (comment == null)
            throw new ArgumentException("Comment not found", nameof(request.CommentId));

        if (comment.Song.OwnerId != request.UserId)
        {
            throw new UnauthorizedAccessException("You don't have permission to update this comment");
        }

        comment.Update(request.Text);

        await _unitOfWork.SongComments.UpdateAsync(comment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedComment = await _unitOfWork.SongComments.GetQueryable()
            .Include(c => c.Song)
                .ThenInclude(s => s.Owner)
            .Include(c => c.Segment)
            .FirstOrDefaultAsync(c => c.Id == comment.Id, cancellationToken);

        return _mapper.Map<SongCommentDto>(updatedComment);
    }
}

