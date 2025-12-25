namespace Application.DTOs.Alboms;

public class AlbumWithSongsDto : AlbumDto
{
    public List<SongInAlbumDto> Songs { get; set; } = new();
}
