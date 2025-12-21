public class SongStatisticsDto
{
    public Guid SongId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int ReviewCount { get; set; }
    public decimal? AverageBeautifulRating { get; set; }
    public decimal? AverageDifficultyRating { get; set; }
    public int CommentsCount { get; set; }
    public int ChordsCount { get; set; }
    public int PatternsCount { get; set; }
    public int SegmentsCount { get; set; }
    public Dictionary<string, int> SegmentTypes { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}