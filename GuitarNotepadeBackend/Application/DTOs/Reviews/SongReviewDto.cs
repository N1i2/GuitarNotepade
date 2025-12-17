namespace Application.DTOs.Reviews;

public class SongReviewDto
{
    public Guid Id { get; set; }
    public Guid SongId { get; set; }
    public string SongTitle { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string ReviewText { get; set; } = string.Empty;
    public int? BeautifulLevel { get; set; }
    public int? DifficultyLevel { get; set; }
    public int LikesCount { get; set; }
    public int DislikesCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool? UserLiked { get; set; } 
}
