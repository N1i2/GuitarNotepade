using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public class CreateSongCommand : IRequest<SongDto>
{
    public Guid UserId { get; }
    public string Title { get; }
    public string? Genre { get; }
    public string? Theme { get; }
    public string? Artist { get; }
    public string? Description { get; }
    public bool IsPublic { get; }
    public string? AudioBase64 { get; }
    public string? AudioType { get; }
    public Guid? ParentSongId { get; }

    public CreateSongCommand(
        Guid userId,
        string title,
        string? genre,
        string? theme,
        string? audioBase64,
        string? audioType,
        string? artist,
        string? description,
        bool isPublic,
        Guid? parentSongId)
    {
        UserId = userId;
        Title = title;
        Genre = genre;
        Theme = theme;
        AudioBase64 = audioBase64;
        AudioType = audioType;
        Artist = artist;
        Description = description;
        IsPublic = isPublic;
        ParentSongId = parentSongId;
    }
}

