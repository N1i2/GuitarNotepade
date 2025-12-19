using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class CreateSongCommentCommandHandler : IRequestHandler<CreateSongCommentCommand, SongCommentDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ISongCommentService _songCommentService;

    public CreateSongCommentCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ISongCommentService songCommentService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _songCommentService = songCommentService;
    }

    public async Task<SongCommentDto> Handle(CreateSongCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = await _songCommentService.CreateCommentAsync(
            request.SongId,
            request.Text,
            request.SegmentId,
            cancellationToken);

        var fullComment = await _unitOfWork.SongComments.GetQueryable()
            .Include(c => c.Song)
                .ThenInclude(s => s.Owner)
            .Include(c => c.Segment)
            .FirstOrDefaultAsync(c => c.Id == comment.Id, cancellationToken);

        return _mapper.Map<SongCommentDto>(fullComment);
    }
}