using Application.DTOs.Alboms;
using MediatR;

namespace Application.Features.Commands.Alboms;

public class UpdateAlbumCommand : IRequest<AlbumDto>
{
    public Guid UserId { get; }
    public Guid AlbumId { get; }
    public string? Title { get; }
    public string? CoverBase64 { get; }
    public string? Description { get; }
    public bool? IsPublic { get; }
    public string? Genre { get; }
    public string? Theme { get; }

    public UpdateAlbumCommand(
        Guid userId,
        Guid albumId,
        string? title = null,
        string? coverBase64 = null,
        string? description = null,
        bool? isPublic = null,
        string? genre = null,
        string? theme = null)
    {
        UserId = userId;
        AlbumId = albumId;
        Title = title;
        CoverBase64 = coverBase64;
        Description = description;
        IsPublic = isPublic;
        Genre = genre;
        Theme = theme;
    }
}