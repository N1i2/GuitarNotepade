using Application.DTOs.Alboms;
using MediatR;

namespace Application.Features.Commands.Alboms
{
    public class CreateAlbumCommand : IRequest<AlbumDto>
    {
        public Guid UserId { get; }
        public string Title { get; }
        public string? Genre { get; }
        public string? Theme { get; }
        public bool IsPublic { get; }
        public string? CoverBase64 { get; }
        public string? Description { get; }

        public CreateAlbumCommand(
            Guid userId,
            string title,
            bool isPublic = false,
            string? genre = null,
            string? theme = null,
            string? coverBase64 = null,
            string? description = null)
        {
            UserId = userId;
            Title = title;
            Genre = genre;
            Theme = theme;
            IsPublic = isPublic;
            CoverBase64 = coverBase64;
            Description = description;
        }
    }
}