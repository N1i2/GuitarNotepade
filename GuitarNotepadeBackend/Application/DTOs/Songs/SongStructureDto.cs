namespace Application.DTOs.Songs;

public class SongStructureDto
{
    public List<SongSegmentDto> Segments { get; set; } = new();
    public SongMetadataDto Metadata { get; set; } = new();
}
