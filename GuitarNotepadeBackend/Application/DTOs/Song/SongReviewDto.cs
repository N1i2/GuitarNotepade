public class SongReviewDto
{
    public Guid Id { get; set; }
    public Guid SongId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public string ReviewText { get; set; } = string.Empty;
    public int? BeautifulLevel { get; set; }
    public int? DifficultyLevel { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}